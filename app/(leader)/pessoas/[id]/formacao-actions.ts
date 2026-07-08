'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { markProgramCompletedSchema } from '@/lib/validations/training'

type ActionResult = { error: string } | { success: true } | undefined

interface PersonGroup {
  groupId: string
  leaderId: string
}

async function getActiveGroupForPerson(personId: string): Promise<PersonGroup | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_relationships')
    .select('group_id, groups!inner(leader_id)')
    .eq('person_id', personId)
    .eq('status', 'active')
    .single()

  if (!data) return null
  const row = data as unknown as { group_id: string; groups: { leader_id: string } }
  return { groupId: row.group_id, leaderId: row.groups.leader_id }
}

export async function markProgramCompleted(
  personId: string,
  programCode: string
): Promise<ActionResult> {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const result = markProgramCompletedSchema.safeParse({
    person_id: personId,
    program_code: programCode,
  })
  if (!result.success) return { error: result.error.errors[0].message }

  const personGroup = await getActiveGroupForPerson(result.data.person_id)
  if (!personGroup) return { error: 'Pessoa não encontrada em nenhum GR ativo.' }

  if (profile.role === 'leader' && personGroup.leaderId !== profile.id) {
    return { error: 'Sem permissão para registrar formação desta pessoa.' }
  }

  const admin = createAdminClient()

  const { data: programData } = await admin
    .from('training_programs')
    .select('id')
    .eq('code', result.data.program_code)
    .single()

  if (!programData) return { error: 'Programa formativo não encontrado.' }
  const program = programData as unknown as { id: string }

  const { data: existing } = await admin
    .from('training_records')
    .select('id')
    .eq('person_id', result.data.person_id)
    .eq('program_id', program.id)
    .maybeSingle()

  if (!existing) {
    const { error } = await admin.from('training_records').insert({
      person_id: result.data.person_id,
      program_id: program.id,
      recorded_by: profile.id,
    } as never)

    if (error) return { error: 'Erro ao registrar programa formativo.' }
  }

  revalidatePath(`/pessoas/${result.data.person_id}`)
  return { success: true }
}
