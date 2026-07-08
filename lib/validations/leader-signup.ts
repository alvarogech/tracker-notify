import { z } from 'zod'

export const leaderSignupSchema = z.object({
  invite_code: z.string().min(1, 'Código de convite obrigatório'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  group_name: z.string().min(2, 'Nome do GR deve ter pelo menos 2 caracteres').max(100),
  day_of_week: z.coerce.number().int().min(0).max(6),
  meeting_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido'),
  location: z.string().min(2, 'Informe o bairro ou endereço').max(200),
})

export type LeaderSignupInput = z.infer<typeof leaderSignupSchema>
