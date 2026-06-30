'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'
import { redirectAfterLogin } from '@/lib/auth/server'
import type { UserRole } from '@/lib/auth/types'

export async function loginAction(_: unknown, formData: FormData) {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Erro ao autenticar.' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  const profile = data as { role: UserRole; active: boolean } | null

  if (!profile?.active) redirect('/acesso-desativado')

  redirect(redirectAfterLogin(profile!.role))
}

export async function recoverPasswordAction(_: unknown, formData: FormData) {
  const email = formData.get('email')?.toString() ?? ''

  if (!email) return { error: 'Informe seu e-mail.' }

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/atualizar-senha`,
  })

  if (error) return { error: 'Não foi possível enviar o e-mail.' }

  return { success: true }
}
