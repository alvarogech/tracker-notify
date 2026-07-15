'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import type { UserProfile } from '@/lib/auth/types'

type ActionResult = { error: string } | { success: true } | undefined

function canManageGroup(profile: UserProfile, leaderId: string): boolean {
  if (profile.role === 'coordinator' || profile.role === 'admin') return true
  return profile.role === 'leader' && leaderId === profile.id
}

async function getGroupLeaderId(groupId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('groups').select('leader_id').eq('id', groupId).single()
  return (data as { leader_id: string } | null)?.leader_id ?? null
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function grantCooperatorAccess(
  personId: string,
  groupId: string,
  email: string
): Promise<{ error: string } | { success: true; password: string }> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])

  const leaderId = await getGroupLeaderId(groupId)
  if (!leaderId || !canManageGroup(profile, leaderId)) {
    return { error: 'Sem permissão para conceder acesso neste GR.' }
  }

  const emailResult = z.string().email('E-mail inválido').safeParse(email)
  if (!emailResult.success) return { error: emailResult.error.errors[0].message }

  const admin = createAdminClient()

  const { data: existing } = await admin.from('group_helpers').select('id').eq('person_id', personId).maybeSingle()
  if (existing) return { error: 'Esta pessoa já tem acesso ao sistema.' }

  // Confirma que a pessoa é mesmo cooperadora ativa deste GR antes de criar login.
  const { data: cooperatorRow } = await admin
    .from('group_cooperators')
    .select('id')
    .eq('person_id', personId)
    .eq('group_id', groupId)
    .is('ended_at', null)
    .maybeSingle()
  if (!cooperatorRow) return { error: 'Esta pessoa não é cooperadora ativa deste GR.' }

  const { data: personData } = await admin.from('people').select('full_name').eq('id', personId).single()
  const fullName = (personData as { full_name: string } | null)?.full_name ?? 'Cooperador'

  const password = generateTempPassword()
  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email: emailResult.data,
    password,
    email_confirm: true,
  })

  if (createUserError || !created.user) {
    if (createUserError?.message.toLowerCase().includes('already')) {
      return { error: 'Este e-mail já está cadastrado no sistema.' }
    }
    return { error: 'Erro ao criar usuário.' }
  }

  const userId = created.user.id

  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    full_name: fullName,
    email: emailResult.data,
    role: 'cooperator',
    active: true,
  } as never)

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao criar perfil de acesso.' }
  }

  const { error: helperError } = await admin.from('group_helpers').insert({
    profile_id: userId,
    group_id: groupId,
    person_id: personId,
    created_by: profile.id,
  } as never)

  if (helperError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao vincular acesso ao GR.' }
  }

  revalidatePath(`/pessoas/${personId}`)
  return { success: true, password }
}

export async function setCooperatorAccessActive(
  personId: string,
  groupId: string,
  active: boolean
): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])

  const leaderId = await getGroupLeaderId(groupId)
  if (!leaderId || !canManageGroup(profile, leaderId)) {
    return { error: 'Sem permissão para alterar o acesso deste cooperador.' }
  }

  const admin = createAdminClient()
  const { data: helperData } = await admin
    .from('group_helpers')
    .select('profile_id')
    .eq('person_id', personId)
    .eq('group_id', groupId)
    .maybeSingle()

  const helper = helperData as { profile_id: string } | null
  if (!helper) return { error: 'Esta pessoa não tem acesso ao sistema.' }

  const { error } = await admin.from('profiles').update({ active } as never).eq('id', helper.profile_id)
  if (error) return { error: 'Erro ao atualizar acesso.' }

  revalidatePath(`/pessoas/${personId}`)
  return { success: true }
}
