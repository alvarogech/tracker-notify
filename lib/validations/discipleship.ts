import { z } from 'zod'

export const assignDisciplerSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  discipler_id: z.string().uuid('Discipulador inválido'),
})

export type AssignDisciplerInput = z.infer<typeof assignDisciplerSchema>

export const endDiscipleshipSchema = z.object({
  assignment_id: z.string().uuid('Vínculo inválido'),
})

export type EndDiscipleshipInput = z.infer<typeof endDiscipleshipSchema>
