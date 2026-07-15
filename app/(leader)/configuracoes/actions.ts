'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { updateGroupSchema } from '@/lib/validations/groups'

type ActionResult = { error: string } | { success: true } | undefined

const updateOwnGroupSchema = updateGroupSchema.omit({ active: true })

export async function updateOwnGroup(_: unknown, formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])

  const raw = {
    name: formData.get('name'),
    day_of_week: formData.get('day_of_week'),
    meeting_time: formData.get('meeting_time'),
    location: formData.get('location') || '',
  }

  const result = updateOwnGroupSchema.safeParse(raw)
  if (!result.success) return { error: result.error.errors[0].message }

  const admin = createAdminClient()
  const { data: groupData } = await admin
    .from('groups')
    .select('id')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .maybeSingle()

  const group = groupData as { id: string } | null
  if (!group) return { error: 'Nenhum GR ativo vinculado a este usuário.' }

  const { error } = await admin
    .from('groups')
    .update({
      name: result.data.name,
      day_of_week: result.data.day_of_week,
      meeting_time: result.data.meeting_time,
      location: result.data.location || null,
    } as never)
    .eq('id', group.id)

  if (error) return { error: 'Erro ao salvar dados do GR.' }

  await admin.from('audit_logs').insert({
    actor_id: profile.id,
    action: 'group_update_self',
    entity_type: 'group',
    entity_id: group.id,
  } as never)

  revalidatePath('/configuracoes')
  revalidatePath('/inicio')
  return { success: true }
}
