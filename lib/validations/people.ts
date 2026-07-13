import { z } from 'zod'

export const createPersonSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z
    .string()
    .regex(/^\+55\d{10,11}$/, 'Telefone inválido. Use formato +5562912345678')
    .optional()
    .or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  type: z.enum(['member', 'visitor']).default('member'),
})

export type CreatePersonInput = z.infer<typeof createPersonSchema>

export const updatePersonSchema = createPersonSchema.omit({ type: true })

export type UpdatePersonInput = z.infer<typeof updatePersonSchema>

export const registerVisitorSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z
    .string()
    .regex(/^\+55\d{10,11}$/, 'Telefone inválido. Use formato +5562912345678')
    .optional()
    .or(z.literal('')),
  visited_at: z.string().optional().or(z.literal('')),
})

export type RegisterVisitorInput = z.infer<typeof registerVisitorSchema>
