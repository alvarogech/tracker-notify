import { z } from 'zod'

export const startServiceAssignmentSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  ministry_area_ids: z.array(z.string().uuid('Área de atuação inválida')).min(1, 'Selecione ao menos uma área'),
})

export type StartServiceAssignmentInput = z.infer<typeof startServiceAssignmentSchema>

export const endServiceAssignmentSchema = z.object({
  assignment_id: z.string().uuid('Vínculo de serviço inválido'),
})

export type EndServiceAssignmentInput = z.infer<typeof endServiceAssignmentSchema>
