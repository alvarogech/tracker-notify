export const TRAINING_PROGRAM_CODES = [
  'cultura_emaus',
  'makarios_1',
  'makarios_2',
  'makarios_3',
] as const

export type TrainingProgramCode = (typeof TRAINING_PROGRAM_CODES)[number]

const BASE_SERVICE_REQUIREMENT: TrainingProgramCode = 'cultura_emaus'

export function isEligibleToServe(completedPrograms: string[]): boolean {
  return new Set(completedPrograms).has(BASE_SERVICE_REQUIREMENT)
}

export function isEligibleToLeadFormatively(completedPrograms: string[]): boolean {
  const completed = new Set(completedPrograms)
  return TRAINING_PROGRAM_CODES.every((code) => completed.has(code))
}

export function canStartServiceAssignment(completedPrograms: string[]): boolean {
  return isEligibleToServe(completedPrograms)
}

// Redação exigida pela seção 12 do CLAUDE.md — nunca "aprovado", "pronto para
// liderar" ou linguagem de promoção/pontuação. Fonte única para a UI.
export const ELIGIBILITY_SERVE_LABEL = 'Atende aos requisitos formativos cadastrados para servir.'
export const ELIGIBILITY_LEADER_LABEL =
  'Atende aos requisitos formativos cadastrados para liderança.'
