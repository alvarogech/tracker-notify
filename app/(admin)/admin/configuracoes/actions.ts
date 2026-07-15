'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import type { UserRole } from '@/lib/auth/types'

type ActionResult = { error: string } | { success: true } | undefined

export async function updateNetworkName(_: unknown, formData: FormData): Promise<ActionResult> {
  await requireRole(['admin'])

  const name = (formData.get('name') as string | null)?.trim()
  if (!name || name.length < 2) return { error: 'Nome deve ter pelo menos 2 caracteres.' }

  const admin = createAdminClient()
  const { data: networkData } = await admin.from('networks').select('id').limit(1).single()
  const network = networkData as { id: string } | null
  if (!network) return { error: 'Rede não encontrada.' }

  const { error } = await admin.from('networks').update({ name } as never).eq('id', network.id)
  if (error) return { error: 'Erro ao salvar nome da rede.' }

  revalidatePath('/admin/configuracoes')
  return { success: true }
}

export async function setProfileActive(profileId: string, active: boolean): Promise<ActionResult> {
  const caller = await requireRole(['admin'])
  if (profileId === caller.id) return { error: 'Você não pode desativar a própria conta.' }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ active } as never).eq('id', profileId)
  if (error) return { error: 'Erro ao atualizar status.' }

  await admin.from('audit_logs').insert({
    actor_id: caller.id,
    action: active ? 'user_activate' : 'user_deactivate',
    entity_type: 'profile',
    entity_id: profileId,
  } as never)

  revalidatePath('/admin/configuracoes')
}

export async function setProfileRole(profileId: string, role: UserRole): Promise<ActionResult> {
  const caller = await requireRole(['admin'])
  if (profileId === caller.id) return { error: 'Você não pode alterar o próprio papel.' }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role } as never).eq('id', profileId)
  if (error) return { error: 'Erro ao atualizar papel.' }

  await admin.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'user_role_change',
    entity_type: 'profile',
    entity_id: profileId,
    details: { role },
  } as never)

  revalidatePath('/admin/configuracoes')
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function resetProfilePassword(
  profileId: string
): Promise<{ error: string } | { success: true; password: string }> {
  const caller = await requireRole(['admin'])

  const password = generateTempPassword()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(profileId, { password })
  if (error) return { error: 'Erro ao redefinir senha.' }

  await admin.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'user_password_reset',
    entity_type: 'profile',
    entity_id: profileId,
  } as never)

  return { success: true, password }
}
