import { z } from 'zod'

export const markProgramCompletedSchema = z.object({
  person_id: z.string().uuid('Pessoa inválida'),
  program_code: z.enum(['cultura_emaus', 'makarios_1', 'makarios_2', 'makarios_3'], {
    errorMap: () => ({ message: 'Programa formativo inválido' }),
  }),
})

export type MarkProgramCompletedInput = z.infer<typeof markProgramCompletedSchema>
