export type VisitorVisit = {
  visitedAt: Date
}

const CONVERSION_SUGGESTION_THRESHOLD = 3

export function countVisits(visits: VisitorVisit[]): number {
  return visits.length
}

export function shouldSuggestConversion(visitCount: number): boolean {
  return visitCount >= CONVERSION_SUGGESTION_THRESHOLD
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function isDuplicatePhone(phoneA: string, phoneB: string): boolean {
  const a = normalizePhone(phoneA)
  const b = normalizePhone(phoneB)
  if (a === '' || b === '') return false
  return a === b
}

export function findDuplicatePhoneMatch<T extends { phone: string | null }>(
  phone: string,
  existingPeople: T[]
): T | null {
  const normalized = normalizePhone(phone)
  if (normalized === '') return null
  return (
    existingPeople.find((p) => p.phone !== null && isDuplicatePhone(normalized, p.phone)) ?? null
  )
}

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function isSimilarName(a: string, b: string): boolean {
  const normA = normalizeName(a)
  const normB = normalizeName(b)
  if (normA === '' || normB === '') return false
  if (normA === normB) return true
  if (normA.includes(normB) || normB.includes(normA)) return true

  const tokensA = normA.split(' ')
  const tokensB = normB.split(' ')
  const sharedTokens = tokensA.filter((t) => t.length > 2 && tokensB.includes(t))
  return sharedTokens.length >= 1 && (tokensA[0] === tokensB[0] || sharedTokens.length >= 2)
}

export function findSimilarNameMatches<T extends { fullName: string }>(
  name: string,
  existingPeople: T[]
): T[] {
  return existingPeople.filter((p) => isSimilarName(name, p.fullName))
}
