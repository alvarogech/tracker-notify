'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

type ActionResult = { error: string } | undefined

export async function approveLeaderSignup(profileId: string): Promise<ActionResult> {
  await requireRole(['admin'])
  const admin = createAdminClient()

  const { error: profileError } = await admin
    .from('profiles')
    .update({ active: true, pending_approval: false } as never)
    .eq('id', profileId)
    .eq('pending_approval', true)

  if (profileError) return { error: 'Erro ao aprovar cadastro.' }

  const { error: groupError } = await admin
    .from('groups')
    .update({ active: true, pending_approval: false } as never)
    .eq('leader_id', profileId)
    .eq('pending_approval', true)

  if (groupError) return { error: 'Erro ao aprovar GR.' }

  revalidatePath('/admin/solicitacoes')
  revalidatePath('/admin')
  revalidatePath('/coordenacao')
}

export async function rejectLeaderSignup(profileId: string): Promise<ActionResult> {
  await requireRole(['admin'])
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('pending_approval')
    .eq('id', profileId)
    .single()

  if (!(profile as { pending_approval: boolean } | null)?.pending_approval) {
    return { error: 'Solicitação não encontrada.' }
  }

  await admin.from('groups').delete().eq('leader_id', profileId).eq('pending_approval', true)
  await admin.from('profiles').delete().eq('id', profileId)
  await admin.auth.admin.deleteUser(profileId)

  revalidatePath('/admin/solicitacoes')
  revalidatePath('/admin')
  revalidatePath('/coordenacao')
}
