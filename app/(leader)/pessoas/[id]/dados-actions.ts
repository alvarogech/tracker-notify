'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { updatePersonSchema } from '@/lib/validations/people'

type ActionResult = { error: string } | { success: true } | undefined

async function getLeaderIdForPerson(personId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_relationships')
    .select('groups!inner(leader_id)')
    .eq('person_id', personId)
    .eq('status', 'active')
    .single()

  if (!data) return null
  const row = data as unknown as { groups: { leader_id: string } }
  return row.groups.leader_id
}

export async function updatePersonDataAction(_: unknown, formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const personId = formData.get('person_id') as string

  const result = updatePersonSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
    birthdate: formData.get('birthdate') || '',
  })
  if (!result.success) return { error: result.error.errors[0].message }

  const leaderId = await getLeaderIdForPerson(personId)
  if (!leaderId) return { error: 'Pessoa não encontrada em nenhum GR ativo.' }
  if (profile.role === 'leader' && leaderId !== profile.id) {
    return { error: 'Sem permissão para editar esta pessoa.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('people')
    .update({
      full_name: result.data.full_name,
      phone: result.data.phone || null,
      email: result.data.email || null,
      birthdate: result.data.birthdate || null,
    } as never)
    .eq('id', personId)

  if (error) return { error: 'Erro ao salvar dados.' }

  revalidatePath(`/pessoas/${personId}`)
  return { success: true }
}
