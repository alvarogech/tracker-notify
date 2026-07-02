import { z } from 'zod'

export const logActionSchema = z.object({
  case_id: z.string().uuid('Caso inválido'),
  description: z
    .string()
    .trim()
    .min(3, 'Descreva a ação com pelo menos 3 caracteres')
    .max(500, 'Descrição muito longa'),
})

export type LogActionInput = z.infer<typeof logActionSchema>

export const resolveCaseSchema = z.object({
  case_id: z.string().uuid('Caso inválido'),
  resolution_notes: z
    .string()
    .trim()
    .max(500, 'Notas de resolução muito longas')
    .optional()
    .or(z.literal('')),
})

export type ResolveCaseInput = z.infer<typeof resolveCaseSchema>

export const createManualCaseSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notas muito longas')
    .optional()
    .or(z.literal('')),
})

export type CreateManualCaseInput = z.infer<typeof createManualCaseSchema>
