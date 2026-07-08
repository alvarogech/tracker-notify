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
