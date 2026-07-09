'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import type { UserProfile } from '@/lib/auth/types'
import {
  assignHostSchema,
  endHostAssignmentSchema,
  addCooperatorSchema,
  removeCooperatorSchema,
} from '@/lib/validations/group-roles'

type ActionResult = { error: string } | { success: true } | undefined

interface PersonGroup {
  groupId: string
  leaderId: string
  type: string
}

async function getActiveGroupForPerson(personId: string): Promise<PersonGroup | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_relationships')
    .select('group_id, type, groups!inner(leader_id)')
    .eq('person_id', personId)
    .eq('status', 'active')
    .single()

  if (!data) return null
  const row = data as unknown as { group_id: string; type: string; groups: { leader_id: string } }
  return { groupId: row.group_id, leaderId: row.groups.leader_id, type: row.type }
}

function canManage(profile: UserProfile, personGroup: PersonGroup, groupId: string): boolean {
  if (personGroup.groupId !== groupId) return false
  if (personGroup.type !== 'member') return false
  if (profile.role === 'coordinator' || profile.role === 'admin') return true
  return personGroup.leaderId === profile.id
}

interface HostAccess {
  id: string
  groupId: string
  leaderId: string
  personId: string
}

async function getAccessibleHostAssignment(assignmentId: string): Promise<HostAccess | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_hosts')
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

interface CooperatorAccess {
  id: string
  groupId: string
  leaderId: string
  personId: string
}

async function getAccessibleCooperatorAssignment(assignmentId: string): Promise<CooperatorAccess | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_cooperators')
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

export async function assignHost(personId: string, groupId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = assignHostSchema.safeParse({ person_id: personId, group_id: groupId })
  if (!result.success) return { error: result.error.errors[0].message }

  const personGroup = await getActiveGroupForPerson(result.data.person_id)
  if (!personGroup) return { error: 'Pessoa não encontrada em nenhum GR ativo.' }

  if (!canManage(profile, personGroup, result.data.group_id)) {
    return { error: 'Sem permissão para definir o anfitrião deste GR.' }
  }

  const admin = createAdminClient()

  const { error: closeError } = await admin
    .from('group_hosts')
    .update({ ended_at: new Date().toISOString() } as never)
    .eq('group_id', result.data.group_id)
    .is('ended_at', null)

  if (closeError) return { error: 'Erro ao encerrar anfitrião anterior.' }

  const { error: insertError } = await admin.from('group_hosts').insert({
    person_id: result.data.person_id,
    group_id: result.data.group_id,
    created_by: profile.id,
  } as never)

  if (insertError) return { error: 'Erro ao definir anfitrião.' }

  revalidatePath(`/pessoas/${result.data.person_id}`)
  revalidatePath('/pessoas')
  return { success: true }
}

export async function endHostAssignment(assignmentId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = endHostAssignmentSchema.safeParse({ assignment_id: assignmentId })
  if (!result.success) return { error: result.error.errors[0].message }

  const assignment = await getAccessibleHostAssignment(result.data.assignment_id)
  if (!assignment) return { error: 'Vínculo de anfitrião não encontrado.' }
  if (profile.role === 'leader' && assignment.leaderId !== profile.id) {
    return { error: 'Sem permissão para encerrar este vínculo.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('group_hosts')
    .update({ ended_at: new Date().toISOString() } as never)
    .eq('id', assignment.id)

  if (error) return { error: 'Erro ao encerrar vínculo de anfitrião.' }

  revalidatePath(`/pessoas/${assignment.personId}`)
  revalidatePath('/pessoas')
  return { success: true }
}

export async function addCooperator(personId: string, groupId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = addCooperatorSchema.safeParse({ person_id: personId, group_id: groupId })
  if (!result.success) return { error: result.error.errors[0].message }

  const personGroup = await getActiveGroupForPerson(result.data.person_id)
  if (!personGroup) return { error: 'Pessoa não encontrada em nenhum GR ativo.' }

  if (!canManage(profile, personGroup, result.data.group_id)) {
    return { error: 'Sem permissão para definir cooperadores deste GR.' }
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('group_cooperators')
    .select('id')
    .eq('person_id', result.data.person_id)
    .eq('group_id', result.data.group_id)
    .is('ended_at', null)
    .maybeSingle()

  if (existing) return { success: true }

  const { error: insertError } = await admin.from('group_cooperators').insert({
    person_id: result.data.person_id,
    group_id: result.data.group_id,
    created_by: profile.id,
  } as never)

  if (insertError) return { error: 'Erro ao adicionar cooperador.' }

  revalidatePath(`/pessoas/${result.data.person_id}`)
  revalidatePath('/pessoas')
  return { success: true }
}

export async function removeCooperator(assignmentId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = removeCooperatorSchema.safeParse({ assignment_id: assignmentId })
  if (!result.success) return { error: result.error.errors[0].message }

  const assignment = await getAccessibleCooperatorAssignment(result.data.assignment_id)
  if (!assignment) return { error: 'Vínculo de cooperador não encontrado.' }
  if (profile.role === 'leader' && assignment.leaderId !== profile.id) {
    return { error: 'Sem permissão para remover este cooperador.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('group_cooperators')
    .update({ ended_at: new Date().toISOString() } as never)
    .eq('id', assignment.id)

  if (error) return { error: 'Erro ao remover cooperador.' }

  revalidatePath(`/pessoas/${assignment.personId}`)
  revalidatePath('/pessoas')
  return { success: true }
}
