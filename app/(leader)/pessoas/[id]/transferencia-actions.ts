'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { transferPersonSchema } from '@/lib/validations/transfers'

type ActionResult = { error: string } | { success: true } | undefined

interface ActiveMembership {
  relationshipId: string
  groupId: string
}

interface ActiveDisciplershipAssignment {
  id: string
  disciplerId: string
}

async function getActiveMembership(personId: string): Promise<ActiveMembership | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_relationships')
    .select('id, group_id')
    .eq('person_id', personId)
    .eq('type', 'member')
    .eq('status', 'active')
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as { id: string; group_id: string }
  return { relationshipId: row.id, groupId: row.group_id }
}

async function getActiveDisciplershipAssignment(
  personId: string
): Promise<ActiveDisciplershipAssignment | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('discipleship_assignments')
    .select('id, discipler_id')
    .eq('person_id', personId)
    .is('ended_at', null)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as { id: string; discipler_id: string }
  return { id: row.id, disciplerId: row.discipler_id }
}

export async function transferPerson(
  personId: string,
  toGroupId: string,
  disciplerDecision: 'keep' | 'end' | 'none',
  reason?: string
): Promise<ActionResult> {
  const profile = await requireRole(['coordinator', 'admin'])

  const result = transferPersonSchema.safeParse({
    person_id: personId,
    to_group_id: toGroupId,
    discipler_decision: disciplerDecision,
    reason: reason ?? '',
  })
  if (!result.success) return { error: result.error.errors[0].message }

  const membership = await getActiveMembership(result.data.person_id)
  if (!membership) {
    return { error: 'Pessoa não encontrada como membro ativo em nenhum GR.' }
  }

  if (membership.groupId === result.data.to_group_id) {
    return { error: 'O GR de destino deve ser diferente do GR atual.' }
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error: endError } = await admin
    .from('group_relationships')
    .update({ status: 'inactive', ended_at: now } as never)
    .eq('id', membership.relationshipId)

  if (endError) return { error: 'Erro ao encerrar vínculo no GR atual.' }

  const { error: insertError } = await admin.from('group_relationships').insert({
    person_id: result.data.person_id,
    group_id: result.data.to_group_id,
    type: 'member',
    status: 'active',
    started_at: now,
  } as never)

  if (insertError) return { error: 'Erro ao criar vínculo no novo GR.' }

  if (result.data.discipler_decision !== 'none') {
    const activeAssignment = await getActiveDisciplershipAssignment(result.data.person_id)
    if (activeAssignment) {
      await admin
        .from('discipleship_assignments')
        .update({ ended_at: now } as never)
        .eq('id', activeAssignment.id)

      if (result.data.discipler_decision === 'keep') {
        await admin.from('discipleship_assignments').insert({
          person_id: result.data.person_id,
          discipler_id: activeAssignment.disciplerId,
          group_id: result.data.to_group_id,
          created_by: profile.id,
        } as never)
      }
    }
  }

  await admin.from('group_transfers').insert({
    person_id: result.data.person_id,
    from_group_id: membership.groupId,
    to_group_id: result.data.to_group_id,
    transferred_by: profile.id,
    reason: result.data.reason || null,
  } as never)

  await admin.from('audit_logs').insert({
    actor_id: profile.id,
    action: 'group_transfer',
    entity_type: 'person',
    entity_id: result.data.person_id,
    details: { from_group_id: membership.groupId, to_group_id: result.data.to_group_id },
  } as never)

  revalidatePath('/pessoas')
  revalidatePath(`/pessoas/${result.data.person_id}`)
  revalidatePath('/coordenacao')
  revalidatePath('/admin')

  return { success: true }
}
