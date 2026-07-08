'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { leaderSignupSchema } from '@/lib/validations/leader-signup'

type ActionResult = { error: string } | { success: true }

export async function signupLeaderAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const raw = {
    invite_code: formData.get('invite_code'),
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    group_name: formData.get('group_name'),
    day_of_week: formData.get('day_of_week'),
    meeting_time: formData.get('meeting_time'),
    location: formData.get('location'),
  }

  const result = leaderSignupSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const expectedCode = process.env.LEADER_SIGNUP_CODE
  if (!expectedCode || result.data.invite_code !== expectedCode) {
    return { error: 'Código de convite inválido.' }
  }

  const admin = createAdminClient()

  const { data: network } = await admin.from('networks').select('id').limit(1).single()
  const networkId = (network as { id: string } | null)?.id
  if (!networkId) return { error: 'Rede não configurada. Contate a administração.' }

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email: result.data.email,
    password: result.data.password,
    email_confirm: true,
  })

  if (createUserError || !created.user) {
    if (createUserError?.message.toLowerCase().includes('already')) {
      return { error: 'Este e-mail já está cadastrado.' }
    }
    return { error: 'Erro ao criar usuário. Tente novamente.' }
  }

  const userId = created.user.id

  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    full_name: result.data.full_name,
    email: result.data.email,
    role: 'leader',
    active: false,
    signup_source: 'self',
    pending_approval: true,
  } as never)

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao criar perfil. Tente novamente.' }
  }

  const { error: groupError } = await admin.from('groups').insert({
    network_id: networkId,
    name: result.data.group_name,
    leader_id: userId,
    day_of_week: result.data.day_of_week,
    meeting_time: result.data.meeting_time,
    location: result.data.location,
    active: false,
    signup_source: 'self',
    pending_approval: true,
  } as never)

  if (groupError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao criar GR. Tente novamente.' }
  }

  return { success: true }
}
