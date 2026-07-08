import { z } from 'zod'

export const transferPersonSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  to_group_id: z.string().uuid('GR de destino inválido'),
  discipler_decision: z.enum(['keep', 'end', 'none']),
  reason: z.string().max(500).optional().or(z.literal('')),
})

export type TransferPersonInput = z.infer<typeof transferPersonSchema>
