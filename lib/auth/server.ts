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

export async function requireRole(allowed: UserRole[]): Promise<UserProfile> {
  const profile = await requireAuth()
  if (!allowed.includes(profile.role)) redirect('/login')
  return profile
}

export function redirectAfterLogin(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'coordinator') return '/coordenacao'
  if (role === 'cooperator') return '/reunioes'
  return '/inicio'
}
