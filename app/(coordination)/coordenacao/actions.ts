'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { updateGroupSchema } from '@/lib/validations/groups'

type ActionResult = { error: string } | undefined

export async function updateGroup(groupId: string, _: unknown, formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(['admin'])

  const raw = {
    name: formData.get('name'),
    day_of_week: formData.get('day_of_week'),
    meeting_time: formData.get('meeting_time'),
    location: formData.get('location') || '',
    active: formData.get('active'),
  }

  const result = updateGroupSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('groups')
    .update({
      name: result.data.name,
      day_of_week: result.data.day_of_week,
      meeting_time: result.data.meeting_time,
      location: result.data.location || null,
      active: result.data.active,
    } as never)
    .eq('id', groupId)

  if (error) return { error: 'Erro ao atualizar GR.' }

  await admin.from('audit_logs').insert({
    actor_id: profile.id,
    action: 'group_update',
    entity_type: 'group',
    entity_id: groupId,
  } as never)

  revalidatePath('/coordenacao')
  revalidatePath('/admin')
  redirect('/coordenacao')
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const profile = await requireRole(['admin'])
  const admin = createAdminClient()

  const { error } = await admin.from('groups').delete().eq('id', groupId)

  if (error) {
    if (error.code === '23503') {
      return {
        error:
          'Não é possível excluir: este GR já possui pessoas, reuniões ou casos vinculados. Desative-o em vez de excluir.',
      }
    }
    return { error: 'Erro ao excluir GR.' }
  }

  await admin.from('audit_logs').insert({
    actor_id: profile.id,
    action: 'group_delete',
    entity_type: 'group',
    entity_id: groupId,
  } as never)

  revalidatePath('/coordenacao')
  revalidatePath('/admin')
}

// Exclusão definitiva para limpeza de GRs de teste: remove, na ordem correta
// de dependência, tudo que referencia este group_id (reuniões, casos,
// discipulado, serviço, anfitrião/cooperadores, transferências), depois o
// vínculo das pessoas com este GR e, por fim, o próprio GR. Pessoas que
// ficarem sem nenhum vínculo em qualquer GR são removidas também; pessoas
// com histórico em outro GR são preservadas (o delete falha silenciosamente
// para elas e seguimos em frente). Uso pretendido: dados de teste antes do
// piloto real — não há como desfazer.
export async function deleteGroupCascade(groupId: string): Promise<ActionResult> {
  const profile = await requireRole(['admin'])
  const admin = createAdminClient()

  const { data: relData } = await admin
    .from('group_relationships')
    .select('person_id')
    .eq('group_id', groupId)
  const personIds = ((relData ?? []) as { person_id: string }[]).map((r) => r.person_id)

  const meetingsResult = await admin.from('meetings').delete().eq('group_id', groupId)
  if (meetingsResult.error) return { error: `Erro ao excluir reuniões: ${meetingsResult.error.message}` }

  const casesResult = await admin.from('pastoral_cases').delete().eq('group_id', groupId)
  if (casesResult.error) return { error: `Erro ao excluir casos de pastoreio: ${casesResult.error.message}` }

  const disciplershipResult = await admin.from('discipleship_assignments').delete().eq('group_id', groupId)
  if (disciplershipResult.error) return { error: `Erro ao excluir discipulado: ${disciplershipResult.error.message}` }

  const serviceResult = await admin.from('service_assignments').delete().eq('group_id', groupId)
  if (serviceResult.error) return { error: `Erro ao excluir vínculos de serviço: ${serviceResult.error.message}` }

  const hostsResult = await admin.from('group_hosts').delete().eq('group_id', groupId)
  if (hostsResult.error) return { error: `Erro ao excluir anfitriões: ${hostsResult.error.message}` }

  const cooperatorsResult = await admin.from('group_cooperators').delete().eq('group_id', groupId)
  if (cooperatorsResult.error) return { error: `Erro ao excluir cooperadores: ${cooperatorsResult.error.message}` }

  const transfersResult = await admin
    .from('group_transfers')
    .delete()
    .or(`from_group_id.eq.${groupId},to_group_id.eq.${groupId}`)
  if (transfersResult.error) return { error: `Erro ao excluir transferências: ${transfersResult.error.message}` }

  const relationshipsResult = await admin.from('group_relationships').delete().eq('group_id', groupId)
  if (relationshipsResult.error) {
    return { error: `Erro ao excluir vínculos de pessoas: ${relationshipsResult.error.message}` }
  }

  let orphanedPeopleRemoved = 0
  for (const personId of personIds) {
    const { count } = await admin
      .from('group_relationships')
      .select('id', { count: 'exact', head: true })
      .eq('person_id', personId)
    if ((count ?? 0) === 0) {
      const { error } = await admin.from('people').delete().eq('id', personId)
      if (!error) orphanedPeopleRemoved += 1
    }
  }

  const { error: groupError } = await admin.from('groups').delete().eq('id', groupId)
  if (groupError) return { error: `Dados do GR removidos, mas falha ao excluir o GR em si: ${groupError.message}` }

  await admin.from('audit_logs').insert({
    actor_id: profile.id,
    action: 'group_delete_cascade',
    entity_type: 'group',
    entity_id: groupId,
    details: { peopleRemoved: orphanedPeopleRemoved, peopleTotal: personIds.length },
  } as never)

  revalidatePath('/coordenacao')
  revalidatePath('/admin')
  redirect('/coordenacao')
}
