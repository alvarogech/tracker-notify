'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import type { UserProfile } from '@/lib/auth/types'
import { canResolveCase } from '@/lib/business-rules/pastoral-cases'
import {
  logActionSchema,
  resolveCaseSchema,
  createManualCaseSchema,
} from '@/lib/validations/pastoral-cases'

type ActionResult = { error: string } | { success: true } | undefined

interface CaseAccess {
  id: string
  personId: string
  groupId: string
  status: string
}

async function getAccessibleCase(caseId: string, profile: UserProfile): Promise<CaseAccess | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('pastoral_cases')
    .select('id, person_id, group_id, status, groups!inner(leader_id)')
    .eq('id', caseId)
    .single()

  if (!data) return null
  const row = data as unknown as {
    id: string
    person_id: string
    group_id: string
    status: string
    groups: { leader_id: string }
  }
  if (profile.role === 'leader' && row.groups.leader_id !== profile.id) return null
  return { id: row.id, personId: row.person_id, groupId: row.group_id, status: row.status }
}

export async function logAction(caseId: string, description: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = logActionSchema.safeParse({ case_id: caseId, description })
  if (!result.success) return { error: result.error.errors[0].message }

  const caseRow = await getAccessibleCase(caseId, profile)
  if (!caseRow) return { error: 'Caso não encontrado ou sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin.from('pastoral_actions').insert({
    case_id: caseId,
    description: result.data.description,
    created_by: profile.id,
  } as never)

  if (error) return { error: 'Erro ao registrar ação.' }
  revalidatePath('/casos')
  revalidatePath(`/casos/${caseId}`)
  return { success: true }
}

export async function resolveCase(caseId: string, resolutionNotes: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = resolveCaseSchema.safeParse({ case_id: caseId, resolution_notes: resolutionNotes })
  if (!result.success) return { error: result.error.errors[0].message }

  const caseRow = await getAccessibleCase(caseId, profile)
  if (!caseRow) return { error: 'Caso não encontrado ou sem permissão.' }
  if (caseRow.status !== 'open') return { error: 'Caso já está resolvido.' }

  const admin = createAdminClient()
  const { count } = await admin
    .from('pastoral_actions')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', caseId)

  if (!canResolveCase(count ?? 0)) {
    return { error: 'Registre ao menos uma ação antes de resolver o caso.' }
  }

  const { error } = await admin
    .from('pastoral_cases')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: profile.id,
      resolution_notes: result.data.resolution_notes || null,
    } as never)
    .eq('id', caseId)

  if (error) return { error: 'Erro ao resolver caso.' }
  revalidatePath('/casos')
  revalidatePath(`/casos/${caseId}`)
  return { success: true }
}

export async function createManualCase(personId: string, notes: string): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const result = createManualCaseSchema.safeParse({ person_id: personId, notes })
  if (!result.success) return { error: result.error.errors[0].message }

  const admin = createAdminClient()

  const { data: groupData } = await admin
    .from('groups')
    .select('id')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .single()

  const group = groupData as { id: string } | null
  if (!group) return { error: 'Nenhum GR vinculado a este líder.' }

  const { data: relData } = await admin
    .from('group_relationships')
    .select('id')
    .eq('person_id', result.data.person_id)
    .eq('group_id', group.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!relData) return { error: 'Pessoa não encontrada neste GR.' }

  const { data: caseData, error: caseError } = await admin
    .from('pastoral_cases')
    .insert({
      person_id: result.data.person_id,
      group_id: group.id,
      status: 'open',
      trigger_streak: null,
      created_by: profile.id,
    } as never)
    .select('id')
    .single()

  if (caseError) {
    // 23505 = violação da unicidade "um caso aberto por pessoa" (constraint de idempotência, 5.7)
    if (caseError.code === '23505') {
      return { error: 'Já existe um caso aberto para esta pessoa.' }
    }
    return { error: 'Erro ao abrir caso.' }
  }

  const newCase = caseData as { id: string } | null
  if (!newCase) return { error: 'Erro ao abrir caso.' }

  if (result.data.notes) {
    await admin.from('pastoral_actions').insert({
      case_id: newCase.id,
      description: result.data.notes,
      created_by: profile.id,
    } as never)
  }

  revalidatePath('/casos')
  revalidatePath(`/pessoas/${result.data.person_id}`)
  return { success: true }
}
