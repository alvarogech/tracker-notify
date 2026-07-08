import { z } from 'zod'

export const startServiceAssignmentSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  ministry_area_id: z.string().uuid('Área de serviço inválida'),
})

export type StartServiceAssignmentInput = z.infer<typeof startServiceAssignmentSchema>

export const endServiceAssignmentSchema = z.object({
  assignment_id: z.string().uuid('Vínculo de serviço inválido'),
})

export type EndServiceAssignmentInput = z.infer<typeof endServiceAssignmentSchema>
