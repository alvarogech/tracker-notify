import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const recoverPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>
