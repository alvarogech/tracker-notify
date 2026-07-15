import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserProfile, UserRole } from './types'
import { redirect } from 'next/navigation'

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Usa admin client para evitar recursão infinita nas policies RLS de profiles
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, role, active, pending_approval')
    .eq('id', user.id)
    .single()

  return data as UserProfile | null
}

export async function requireAuth(): Promise<UserProfile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (!profile.active) redirect('/acesso-desativado')
  return profile
}

// Não delega para requireAuth() — Next.js 14 + runtime do Netlify tem um bug
// conhecido em que redirect() lançado de dentro de uma função async aninhada
// (função A chama await função B, que lança redirect()) às vezes não é
// tratado corretamente e vira um erro genérico em vez de redirecionar. Manter
// tudo num único nível (sem delegar para requireAuth) evita o padrão.
export async function requireRole(allowed: UserRole[]): Promise<UserProfile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (!profile.active) redirect('/acesso-desativado')
  if (!allowed.includes(profile.role)) redirect('/login')
  return profile
}

export function redirectAfterLogin(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'coordinator') return '/coordenacao'
  if (role === 'cooperator') return '/reunioes'
  return '/inicio'
}
