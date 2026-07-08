import { z } from 'zod'

export const updateGroupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  day_of_week: z.coerce.number().int().min(0).max(6),
  meeting_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido'),
  location: z.string().max(200).optional().or(z.literal('')),
  active: z.coerce.boolean(),
})

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
