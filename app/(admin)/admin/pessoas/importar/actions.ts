'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { createPersonSchema } from '@/lib/validations/people'
import type { ImportRow } from '@/lib/people/import'

interface ImportResult {
  imported: number
  errors: { line: number; reason: string }[]
}

export async function importPeopleAction(groupId: string, rows: ImportRow[]): Promise<ImportResult> {
  await requireRole(['admin'])

  if (!groupId) {
    return { imported: 0, errors: [{ line: 0, reason: 'Selecione um GR.' }] }
  }
  if (rows.length === 0) {
    return { imported: 0, errors: [{ line: 0, reason: 'Nenhuma linha para importar.' }] }
  }

  const admin = createAdminClient()

  const { data: group } = await admin.from('groups').select('id').eq('id', groupId).single()
  if (!group) {
    return { imported: 0, errors: [{ line: 0, reason: 'GR não encontrado.' }] }
  }

  const errors: { line: number; reason: string }[] = []
  const validRows: ImportRow[] = []

  rows.forEach((row, idx) => {
    const result = createPersonSchema.safeParse(row)
    if (!result.success) {
      errors.push({ line: idx + 1, reason: `${row.full_name || '(sem nome)'}: ${result.error.errors[0].message}` })
    } else {
      validRows.push(row)
    }
  })

  if (validRows.length === 0) {
    return { imported: 0, errors }
  }

  const { data: insertedPeople, error: peopleError } = await admin
    .from('people')
    .insert(
      validRows.map((r) => ({
        full_name: r.full_name,
        phone: r.phone || null,
        email: r.email || null,
        birthdate: r.birthdate || null,
      })) as never
    )
    .select('id')

  if (peopleError || !insertedPeople) {
    return {
      imported: 0,
      errors: [...errors, { line: 0, reason: `Erro ao inserir pessoas: ${peopleError?.message ?? 'desconhecido'}` }],
    }
  }

  const people = insertedPeople as unknown as { id: string }[]

  const { error: relError } = await admin.from('group_relationships').insert(
    people.map((p, i) => ({
      person_id: p.id,
      group_id: groupId,
      type: validRows[i].type,
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
