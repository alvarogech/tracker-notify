'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { registerVisitorSchema } from '@/lib/validations/people'
import { findDuplicatePhoneMatch, findSimilarNameMatches } from '@/lib/business-rules/visitors'

type ActionResult = { error: string } | { success: true } | undefined

interface LeaderGroup {
  id: string
}

interface VisitorRelationship {
  id: string
  personId: string
  groupId: string
}

async function getLeaderGroup(leaderId: string): Promise<LeaderGroup | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('groups')
    .select('id')
    .eq('leader_id', leaderId)
    .eq('active', true)
    .single()
  return (data as LeaderGroup | null) ?? null
}

async function assertActiveVisitorRelationship(
  relationshipId: string,
  leaderId: string
): Promise<VisitorRelationship | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_relationships')
    .select('id, person_id, group_id, type, status, groups!inner(leader_id)')
    .eq('id', relationshipId)
    .eq('type', 'visitor')
    .eq('status', 'active')
    .single()

  if (!data) return null
  const row = data as unknown as {
    id: string
    person_id: string
    group_id: string
    groups: { leader_id: string }
  }
  if (row.groups.leader_id !== leaderId) return null
  return { id: row.id, personId: row.person_id, groupId: row.group_id }
}

export async function recordVisit(relationshipId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const relationship = await assertActiveVisitorRelationship(relationshipId, profile.id)
  if (!relationship) return { error: 'Visitante não encontrado ou sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin.from('visitor_visits').insert({
    group_relationship_id: relationship.id,
  } as never)

  if (error) return { error: 'Erro ao registrar visita.' }
  revalidatePath('/pessoas')
  revalidatePath(`/pessoas/${relationship.personId}`)
  return { success: true }
}

export async function registerNewVisitor(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | { warning: string; personId: string } | undefined> {
  const profile = await requireRole(['leader'])

  const raw = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || '',
  }
  const result = registerVisitorSchema.safeParse(raw)
  if (!result.success) return { error: result.error.errors[0].message }

  const group = await getLeaderGroup(profile.id)
  if (!group) return { error: 'Nenhum GR vinculado a este líder.' }

  const admin = createAdminClient()
  const { data: existingPeople } = await admin
    .from('people')
    .select('id, full_name, phone')
    .is('archived_at', null)

  const people = (existingPeople ?? []) as { id: string; full_name: string; phone: string | null }[]

  const phoneMatch = result.data.phone ? findDuplicatePhoneMatch(result.data.phone, people) : null
  const nameMatches = findSimilarNameMatches(
    result.data.full_name,
    people.map((p) => ({ fullName: p.full_name, id: p.id }))
  )

  const { data: personData, error: personError } = await admin
    .from('people')
    .insert({
      full_name: result.data.full_name,
      phone: result.data.phone || null,
    } as never)
    .select('id')
    .single()

  const person = personData as { id: string } | null
  if (personError || !person) return { error: 'Erro ao cadastrar visitante.' }

  const { data: relData, error: relError } = await admin
    .from('group_relationships')
    .insert({
      person_id: person.id,
      group_id: group.id,
      type: 'visitor',
      status: 'active',
    } as never)
    .select('id')
    .single()

  const relationship = relData as { id: string } | null
  if (relError || !relationship) return { error: 'Erro ao vincular visitante ao GR.' }

  const { error: visitError } = await admin.from('visitor_visits').insert({
    group_relationship_id: relationship.id,
  } as never)
  if (visitError) return { error: 'Erro ao registrar primeira visita.' }

  revalidatePath('/pessoas')

  if (phoneMatch) {
    return {
      warning: `Telefone já cadastrado para ${phoneMatch.full_name}. Verifique se não é duplicidade.`,
      personId: person.id,
    }
  }
  if (nameMatches.length > 0) {
    return {
      warning: `Nome semelhante a cadastro existente: ${nameMatches.map((m) => m.fullName).join(', ')}.`,
      personId: person.id,
    }
  }
  return undefined
}

export async function confirmConversion(relationshipId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const relationship = await assertActiveVisitorRelationship(relationshipId, profile.id)
  if (!relationship) return { error: 'Visitante não encontrado ou sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('group_relationships')
    .update({
      type: 'member',
    } as never)
    .eq('id', relationship.id)

  if (error) return { error: 'Erro ao confirmar vinculação.' }
  revalidatePath('/pessoas')
  revalidatePath(`/pessoas/${relationship.personId}`)
  return { success: true }
}

export async function closeVisitorRelationship(relationshipId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const relationship = await assertActiveVisitorRelationship(relationshipId, profile.id)
  if (!relationship) return { error: 'Visitante não encontrado ou sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('group_relationships')
    .update({
      status: 'inactive',
      ended_at: new Date().toISOString(),
    } as never)
    .eq('id', relationship.id)

  if (error) return { error: 'Erro ao encerrar relação de visitante.' }
  revalidatePath('/pessoas')
  revalidatePath(`/pessoas/${relationship.personId}`)
  return { success: true }
}
