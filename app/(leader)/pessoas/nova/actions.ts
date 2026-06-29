'use server'

import { createClient } from '@/lib/supabase/server'
import { createPersonSchema } from '@/lib/validations/people'
import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export async function createPersonAction(_: unknown, formData: FormData) {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()

  const raw = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
    birthdate: formData.get('birthdate') || '',
    type: formData.get('type') || 'member',
  }

  const result = createPersonSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const { data: groupData } = await supabase
    .from('groups')
    .select('id')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .single()

  const group = groupData as { id: string } | null
  if (!group) return { error: 'Nenhum GR vinculado a este líder.' }

  const { data: personData, error: personError } = await supabase
    .from('people')
    .insert({
      full_name: result.data.full_name,
      phone: result.data.phone || null,
      email: result.data.email || null,
      birthdate: result.data.birthdate || null,
    } as never)
    .select('id')
    .single()

  const person = personData as { id: string } | null
  if (personError || !person) return { error: 'Erro ao cadastrar pessoa.' }

  const { error: relError } = await supabase
    .from('group_relationships')
    .insert({
      person_id: person.id,
      group_id: group.id,
      type: result.data.type,
      status: 'active',
    } as never)

  if (relError) return { error: 'Erro ao vincular pessoa ao GR.' }

  redirect('/pessoas')
}
