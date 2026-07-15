import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserProfile, UserRole } from './types'
import { redirect } from 'next/navigation'
import { withTimeout } from '@/lib/timeout'

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = createClient()

  // supabase.auth.getUser() pode ficar lento/travar (mesmo problema do
  // middleware.ts) — trata timeout como "sem sessão" em vez de deixar a
  // function inteira estourar o orçamento de execução.
  let user: { id: string } | null = null
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), 8000)
    user = data.user
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[getCurrentProfile] getUser() falhou ou expirou:', e)
    return null
  }
  if (!user) return null

  try {
    // Usa admin client para evitar recursão infinita nas policies RLS de profiles
    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, email, role, active, pending_approval')
      .eq('id', user.id)
      .single()

    return data as UserProfile | null
  } catch (e) {
    // Next.js redige a mensagem de erro enviada ao navegador em produção — loga
    // aqui, no servidor, para conseguir ver a causa real nos logs da Netlify.
    // eslint-disable-next-line no-console
    console.error('[getCurrentProfile] consulta a profiles falhou:', e)
    throw e
  }
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
