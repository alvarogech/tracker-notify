'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import type { UserProfile } from '@/lib/auth/types'
import { assignDisciplerSchema, endDiscipleshipSchema } from '@/lib/validations/discipleship'

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

async function isValidDiscipler(disciplerId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('id', disciplerId)
    .eq('active', true)
    .in('role', ['leader', 'coordinator', 'admin'])
    .maybeSingle()
  return !!data
}

function canAssign(profile: UserProfile, personGroup: PersonGroup, disciplerId: string): boolean {
  if (profile.role === 'coordinator' || profile.role === 'admin') return true
  // Líder só enxerga o próprio perfil via RLS de profiles (profiles_self_read),
  // então só pode se atribuir como discipulador do próprio GR.
  return personGroup.leaderId === profile.id && disciplerId === profile.id
}

interface AssignmentAccess {
  id: string
  groupId: string
  leaderId: string
  personId: string
}

async function getAccessibleAssignment(assignmentId: string): Promise<AssignmentAccess | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('discipleship_assignments')
    .select('id, group_id, person_id, groups!inner(leader_id)')
    .eq('id', assignmentId)
    .is('ended_at', null)
    .single()

  if (!data) return null
  const row = data as unknown as {
    id: string
    group_id: string
    person_id: string
    groups: { leader_id: string }
  }
  return { id: row.id, groupId: row.group_id, leaderId: row.groups.leader_id, personId: row.person_id }
}

export async function assignDiscipler(personId: string, disciplerId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = assignDisciplerSchema.safeParse({ person_id: personId, discipler_id: disciplerId })
  if (!result.success) return { error: result.error.errors[0].message }

  const personGroup = await getActiveGroupForPerson(result.data.person_id)
  if (!personGroup) return { error: 'Pessoa não encontrada em nenhum GR ativo.' }

  if (!canAssign(profile, personGroup, result.data.discipler_id)) {
    return { error: 'Sem permissão para atribuir este discipulador.' }
  }

  const validDiscipler = await isValidDiscipler(result.data.discipler_id)
  if (!validDiscipler) return { error: 'Discipulador inválido.' }

  const admin = createAdminClient()

  const { error: closeError } = await admin
    .from('discipleship_assignments')
    .update({ ended_at: new Date().toISOString() } as never)
    .eq('person_id', result.data.person_id)
    .is('ended_at', null)

  if (closeError) return { error: 'Erro ao encerrar vínculo anterior.' }

  const { error: insertError } = await admin.from('discipleship_assignments').insert({
    person_id: result.data.person_id,
    discipler_id: result.data.discipler_id,
    group_id: personGroup.groupId,
    created_by: profile.id,
  } as never)

  if (insertError) return { error: 'Erro ao atribuir discipulador.' }

  revalidatePath(`/pessoas/${result.data.person_id}`)
  return { success: true }
}

export async function endDiscipleshipAssignment(assignmentId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = endDiscipleshipSchema.safeParse({ assignment_id: assignmentId })
  if (!result.success) return { error: result.error.errors[0].message }

  const assignment = await getAccessibleAssignment(result.data.assignment_id)
  if (!assignment) return { error: 'Vínculo não encontrado.' }
  if (profile.role === 'leader' && assignment.leaderId !== profile.id) {
    return { error: 'Sem permissão para encerrar este vínculo.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('discipleship_assignments')
    .update({ ended_at: new Date().toISOString() } as never)
    .eq('id', assignment.id)

  if (error) return { error: 'Erro ao encerrar vínculo.' }

  revalidatePath(`/pessoas/${assignment.personId}`)
  return { success: true }
}
