'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'

type ActionResult = { error: string } | { success: true } | undefined

const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem.',
    path: ['confirm'],
  })

export async function updateOwnPassword(_: unknown, formData: FormData): Promise<ActionResult> {
  await requireAuth()

  const result = changePasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!result.success) return { error: result.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: result.data.password })
  if (error) return { error: 'Erro ao alterar senha.' }

  return { success: true }
}
