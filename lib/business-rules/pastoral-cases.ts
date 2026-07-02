import { needsPastoralCase, needsEscalation } from './absences'

export type PastoralCaseStatus = 'open' | 'resolved'

export function shouldCreateCase(streak: number, hasOpenCase: boolean): boolean {
  return needsPastoralCase(streak) && !hasOpenCase
}

export function shouldEscalate(
  streak: number,
  hasOpenCase: boolean,
  alreadyEscalated: boolean
): boolean {
  return hasOpenCase && needsEscalation(streak) && !alreadyEscalated
}

export function canResolveCase(actionCount: number): boolean {
  return actionCount >= 1
}
