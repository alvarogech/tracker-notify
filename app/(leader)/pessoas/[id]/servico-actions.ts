'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { startServiceAssignmentSchema, endServiceAssignmentSchema } from '@/lib/validations/service'
import { isEligibleToServe } from '@/lib/business-rules/eligibility'

type ActionResult = { error: string } | { success: true } | undefined

interface PersonGroup {
  groupId: string
  leaderId: string
}

async function getActiveGroupForPerson(personId: string): Promise<PersonGroup | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_relationships')
    .select('group_id, groups!inner(leader_id)')
    .eq('person_id', personId)
    .eq('status', 'active')
    .single()

  if (!data) return null
  const row = data as unknown as { group_id: string; groups: { leader_id: string } }
  return { groupId: row.group_id, leaderId: row.groups.leader_id }
}

async function getCompletedProgramCodes(personId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('training_records')
    .select('training_programs(code)')
    .eq('person_id', personId)

  const rows = (data ?? []) as unknown as { training_programs: { code: string } | null }[]
  return rows.map((row) => row.training_programs?.code).filter((code): code is string => !!code)
}

interface AssignmentAccess {
  id: string
  leaderId: string
  personId: string
}

async function getAccessibleAssignment(assignmentId: string): Promise<AssignmentAccess | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('service_assignments')
    .select('id, person_id, groups!inner(leader_id)')
    .eq('id', assignmentId)
    .is('ended_at', null)
    .single()

  if (!data) return null
  const row = data as unknown as {
    id: string
    person_id: string
    groups: { leader_id: string }
  }
  return { id: row.id, leaderId: row.groups.leader_id, personId: row.person_id }
}

export async function startServiceAssignments(
  personId: string,
  ministryAreaIds: string[]
): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = startServiceAssignmentSchema.safeParse({
    person_id: personId,
    ministry_area_ids: ministryAreaIds,
  })
  if (!result.success) return { error: result.error.errors[0].message }

  const personGroup = await getActiveGroupForPerson(result.data.person_id)
  if (!personGroup) return { error: 'Pessoa não encontrada em nenhum GR ativo.' }

  if (profile.role === 'leader' && personGroup.leaderId !== profile.id) {
    return { error: 'Sem permissão para registrar atuação desta pessoa.' }
  }

  const completedPrograms = await getCompletedProgramCodes(result.data.person_id)
  if (!isEligibleToServe(completedPrograms)) {
    return { error: 'Novo vínculo de atuação exige Cultura Emaús concluído.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('service_assignments').insert(
    result.data.ministry_area_ids.map((ministryAreaId) => ({
      person_id: result.data.person_id,
      ministry_area_id: ministryAreaId,
      group_id: personGroup.groupId,
      created_by: profile.id,
    })) as never
  )

  if (error) return { error: 'Erro ao iniciar vínculo de atuação.' }

  revalidatePath(`/pessoas/${result.data.person_id}`)
  return { success: true }
}

export async function endServiceAssignment(assignmentId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = endServiceAssignmentSchema.safeParse({ assignment_id: assignmentId })
  if (!result.success) return { error: result.error.errors[0].message }

  const assignment = await getAccessibleAssignment(result.data.assignment_id)
  if (!assignment) return { error: 'Vínculo de atuação não encontrado.' }
  if (profile.role === 'leader' && assignment.leaderId !== profile.id) {
    return { error: 'Sem permissão para encerrar este vínculo.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_assignments')
    .update({ ended_at: new Date().toISOString() } as never)
    .eq('id', assignment.id)

  if (error) return { error: 'Erro ao encerrar vínculo de atuação.' }

  revalidatePath(`/pessoas/${assignment.personId}`)
  return { success: true }
}
