export type GroupHostAssignment = {
  personId: string
  groupId: string
  startedAt: Date
  endedAt: Date | null
}

export type GroupCooperatorAssignment = {
  personId: string
  groupId: string
  startedAt: Date
  endedAt: Date | null
}

export function resolveActiveHost<T extends { endedAt: Date | null }>(assignments: T[]): T | null {
  return assignments.find((a) => a.endedAt === null) ?? null
}

export function hasActiveHost(assignments: { endedAt: Date | null }[]): boolean {
  return resolveActiveHost(assignments) !== null
}

export function resolveActiveCooperators<T extends { endedAt: Date | null }>(assignments: T[]): T[] {
  return assignments.filter((a) => a.endedAt === null)
}

export function isActiveCooperator(assignments: { endedAt: Date | null }[]): boolean {
  return resolveActiveCooperators(assignments).length > 0
}
