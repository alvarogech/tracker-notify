'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { createPersonSchema } from '@/lib/validations/people'

const nameSchema = createPersonSchema.pick({ full_name: true })

interface ImportResult {
  imported: number
  errors: { line: number; reason: string }[]
}

export async function importPeopleAction(groupId: string, names: string[]): Promise<ImportResult> {
  await requireRole(['admin'])

  if (!groupId) {
    return { imported: 0, errors: [{ line: 0, reason: 'Selecione um GR.' }] }
  }
  if (names.length === 0) {
    return { imported: 0, errors: [{ line: 0, reason: 'Nenhum nome para importar.' }] }
  }

  const admin = createAdminClient()

  const { data: group } = await admin.from('groups').select('id').eq('id', groupId).single()
  if (!group) {
    return { imported: 0, errors: [{ line: 0, reason: 'GR não encontrado.' }] }
  }

  const errors: { line: number; reason: string }[] = []
  const validNames: string[] = []

  names.forEach((name, idx) => {
    const result = nameSchema.safeParse({ full_name: name })
    if (!result.success) {
      errors.push({ line: idx + 1, reason: `"${name}": ${result.error.errors[0].message}` })
    } else {
      validNames.push(result.data.full_name)
    }
  })

  if (validNames.length === 0) {
    return { imported: 0, errors }
  }

  const { data: insertedPeople, error: peopleError } = await admin
    .from('people')
    .insert(validNames.map((full_name) => ({ full_name })) as never)
    .select('id')

  if (peopleError || !insertedPeople) {
    return {
      imported: 0,
      errors: [...errors, { line: 0, reason: `Erro ao inserir pessoas: ${peopleError?.message ?? 'desconhecido'}` }],
    }
  }

  const people = insertedPeople as unknown as { id: string }[]

  const { error: relError } = await admin.from('group_relationships').insert(
    people.map((p) => ({
      person_id: p.id,
      group_id: groupId,
      type: 'member',
      status: 'active',
    })) as never
  )

  if (relError) {
    return {
      imported: 0,
      errors: [...errors, { line: 0, reason: `Pessoas criadas, mas falha ao vincular ao GR: ${relError.message}` }],
    }
  }

  return { imported: people.length, errors }
}
