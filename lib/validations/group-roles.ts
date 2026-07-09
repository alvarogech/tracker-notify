import { z } from 'zod'

export const assignHostSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  group_id: z.string().uuid('GR inválido'),
})

export type AssignHostInput = z.infer<typeof assignHostSchema>

export const endHostAssignmentSchema = z.object({
  assignment_id: z.string().uuid('Vínculo de anfitrião inválido'),
})

export type EndHostAssignmentInput = z.infer<typeof endHostAssignmentSchema>

export const addCooperatorSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  group_id: z.string().uuid('GR inválido'),
})

export type AddCooperatorInput = z.infer<typeof addCooperatorSchema>

export const removeCooperatorSchema = z.object({
  assignment_id: z.string().uuid('Vínculo de cooperador inválido'),
})

export type RemoveCooperatorInput = z.infer<typeof removeCooperatorSchema>
