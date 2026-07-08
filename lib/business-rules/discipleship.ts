export type DiscipleshipAssignment = {
  disciplerId: string
  startedAt: Date
  endedAt: Date | null
}

export function resolveActiveAssignment<T extends { endedAt: Date | null }>(
  assignments: T[]
): T | null {
  return assignments.find((a) => a.endedAt === null) ?? null
}

export function hasActiveDiscipler(assignments: { endedAt: Date | null }[]): boolean {
  return resolveActiveAssignment(assignments) !== null
}
