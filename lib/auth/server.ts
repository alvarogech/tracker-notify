import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserProfile, UserRole } from './types'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { withTimeout } from '@/lib/timeout'

// middleware.ts já resolve a sessão e repassa o id via header — evita
// chamar supabase.auth.getUser() de novo aqui, que dobraria a latência de
// toda página protegida (cada chamada pode custar vários segundos quando o
// Supabase Auth está lento). Header ausente (nunca passou pelo middleware,
// ex. chamado de um Route Handler fora do matcher) cai no fallback abaixo.
async function resolveUserId(): Promise<string | null> {
  const fromMiddleware = headers().get('x-huios-user-id')
  if (fromMiddleware !== null) return fromMiddleware || null

  const supabase = createClient()
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), 8000)
    return data.user?.id ?? null
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[resolveUserId] getUser() falhou ou expirou:', e)
    return null
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const userId = await resolveUserId()
  if (!userId) return null

  try {
    // Usa admin client para evitar recursão infinita nas policies RLS de profiles
    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, email, role, active, pending_approval')
      .eq('id', userId)
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
