// Indicadores operacionais dos painéis de líder e coordenação (Fase 9).
// Produzem apenas contagens, taxas e razões sobre fatos operacionais — nunca
// pontuação, ranking entre GRs/pessoas ou julgamento de maturidade espiritual
// (CLAUDE.md seção 12). Cada indicador de cobertura usa a mesma forma
// (count/total/rate) para permitir formatação uniforme na UI.

export interface RateResult {
  count: number
  total: number
  rate: number | null
}

function toRate(count: number, total: number): RateResult {
  return { count, total, rate: total === 0 ? null : count / total }
}

export function computeCoverageRate(flags: boolean[]): RateResult {
  return toRate(flags.filter(Boolean).length, flags.length)
}

export type SimpleAttendanceStatus = 'present' | 'absent' | 'excused' | 'on_leave'

// Pessoa em afastamento temporário nunca acumula ausência (5.1) — pelo mesmo
// motivo, não entra no denominador da taxa de presença.
export function computeAttendanceRate(statuses: SimpleAttendanceStatus[]): RateResult {
  const counted = statuses.filter((s) => s !== 'on_leave')
  const present = counted.filter((s) => s === 'present').length
  return toRate(present, counted.length)
}

export function formatRatePercent(result: RateResult): string {
  if (result.rate === null) return '—'
  return `${Math.round(result.rate * 100)}%`
}

export function formatRateFraction(result: RateResult): string {
  if (result.total === 0) return '—'
  return `${result.count}/${result.total} (${Math.round((result.rate ?? 0) * 100)}%)`
}

function sortByMostRecentFirst<T extends { scheduledAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
}

export function selectRecentMeetings<T extends { scheduledAt: Date }>(
  items: T[],
  limit: number
): T[] {
  return sortByMostRecentFirst(items).slice(0, limit)
}

// Mesma seleção acima, mas aplicada independentemente a cada GR — usada pela
// coordenação para compor a taxa de presença da rede sem deixar um único GR
// com muitas reuniões dominar a amostra de um GR com poucas.
export function selectRecentMeetingsPerGroup<T extends { groupId: string; scheduledAt: Date }>(
  items: T[],
  limit: number
): T[] {
  const byGroup = new Map<string, T[]>()
  for (const item of items) {
    const list = byGroup.get(item.groupId)
    if (list) list.push(item)
    else byGroup.set(item.groupId, [item])
  }
  return Array.from(byGroup.values()).flatMap((list) => selectRecentMeetings(list, limit))
}
