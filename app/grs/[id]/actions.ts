'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

type ActionResult = { error: string } | { success: true }

const phoneSchema = z
  .string()
  .regex(/^\+55\d{10,11}$/, 'Telefone inválido. Use formato +5562912345678')
  .optional()
  .or(z.literal(''))

const submissionSchema = z.object({
  personId: z.string().uuid().optional().or(z.literal('')),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional().or(z.literal('')),
  phone: phoneSchema,
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
})

// Sem autenticação por design — este é o link público de divulgação/
// autocompletar (CLAUDE.md não define esse fluxo, foi aprovado pelo
// responsável pelo produto com este modelo de confiança específico:
// a pessoa escolhe o próprio nome numa lista já vinculada ao GR, sem
// revisão manual antes de valer). Cada passo abaixo confirma que o
// person_id enviado realmente pertence a este group_id antes de
// escrever, para que a URL pública não vire um jeito de editar
// qualquer pessoa de qualquer GR.
export async function submitPublicGroupSignup(groupId: string, raw: unknown): Promise<ActionResult> {
  const result = submissionSchema.safeParse(raw)
  if (!result.success) return { error: result.error.errors[0].message }

  const admin = createAdminClient()

  const { data: groupData } = await admin.from('groups').select('id').eq('id', groupId).eq('active', true).single()
  if (!groupData) return { error: 'GR não encontrado.' }

  if (result.data.personId) {
    const { data: relData } = await admin
      .from('group_relationships')
      .select('id')
      .eq('group_id', groupId)
      .eq('person_id', result.data.personId)
      .eq('status', 'active')
      .maybeSingle()
    if (!relData) return { error: 'Pessoa não encontrada neste GR.' }

    const { error } = await admin
      .from('people')
      .update({
        phone: result.data.phone || null,
        email: result.data.email || null,
        birthdate: result.data.birthdate || null,
      } as never)
      .eq('id', result.data.personId)

    if (error) return { error: 'Erro ao salvar dados.' }
  } else {
    if (!result.data.full_name) return { error: 'Informe seu nome completo.' }

    const { data: personData, error: personError } = await admin
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
    if (personError || !person) return { error: 'Erro ao cadastrar.' }

    // Entra como visitante, não membro: quem preenche pode ser alguém que
    // já frequenta mas ficou fora da planilha, ou um visitante novo vindo
    // da página de divulgação — cabe ao líder confirmar pessoalmente antes
    // de virar membro (mesma régua de conversão já usada em toda visita
    // presencial, ver lib/business-rules/visitors.ts).
    const { error: relError } = await admin.from('group_relationships').insert({
      person_id: person.id,
      group_id: groupId,
      type: 'visitor',
      status: 'active',
    } as never)

    if (relError) return { error: 'Erro ao vincular ao GR.' }
  }

  revalidatePath('/pessoas')
  return { success: true }
}
