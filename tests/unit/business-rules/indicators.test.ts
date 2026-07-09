import { describe, it, expect } from 'vitest'
import {
  computeCoverageRate,
  computeAttendanceRate,
  formatRatePercent,
  formatRateFraction,
  selectRecentMeetings,
  selectRecentMeetingsPerGroup,
} from '@/lib/business-rules/indicators'

describe('computeCoverageRate', () => {
  it('lista vazia → total 0, taxa nula', () => {
    expect(computeCoverageRate([])).toEqual({ count: 0, total: 0, rate: null })
  })

  it('todos verdadeiros → taxa 100%', () => {
    expect(computeCoverageRate([true, true, true])).toEqual({ count: 3, total: 3, rate: 1 })
  })

  it('metade verdadeiros → taxa 50%', () => {
    expect(computeCoverageRate([true, false, true, false])).toEqual({
      count: 2,
      total: 4,
      rate: 0.5,
    })
  })

  it('todos falsos → taxa 0%', () => {
    expect(computeCoverageRate([false, false])).toEqual({ count: 0, total: 2, rate: 0 })
  })
})

describe('computeAttendanceRate', () => {
  it('afastamento temporário não entra no denominador (5.1)', () => {
    const result = computeAttendanceRate(['present', 'on_leave', 'on_leave'])
    expect(result).toEqual({ count: 1, total: 1, rate: 1 })
  })

  it('presentes, ausentes e justificadas contam no denominador', () => {
    const result = computeAttendanceRate(['present', 'absent', 'excused', 'present'])
    expect(result).toEqual({ count: 2, total: 4, rate: 0.5 })
  })

  it('somente afastamentos → total 0, taxa nula', () => {
    expect(computeAttendanceRate(['on_leave', 'on_leave'])).toEqual({
      count: 0,
      total: 0,
      rate: null,
    })
  })

  it('lista vazia → total 0, taxa nula', () => {
    expect(computeAttendanceRate([])).toEqual({ count: 0, total: 0, rate: null })
  })
})

describe('formatRatePercent', () => {
  it('taxa nula → travessão', () => {
    expect(formatRatePercent({ count: 0, total: 0, rate: null })).toBe('—')
  })

  it('arredonda para o inteiro mais próximo', () => {
    expect(formatRatePercent({ count: 1, total: 3, rate: 1 / 3 })).toBe('33%')
  })
})

describe('formatRateFraction', () => {
  it('total 0 → travessão', () => {
    expect(formatRateFraction({ count: 0, total: 0, rate: null })).toBe('—')
  })

  it('formata como "count/total (percentual)"', () => {
    expect(formatRateFraction({ count: 2, total: 4, rate: 0.5 })).toBe('2/4 (50%)')
  })
})

describe('selectRecentMeetings', () => {
  it('ordena do mais recente para o mais antigo e aplica o limite', () => {
    const items = [
      { id: 'a', scheduledAt: new Date('2026-01-01') },
      { id: 'b', scheduledAt: new Date('2026-03-01') },
      { id: 'c', scheduledAt: new Date('2026-02-01') },
    ]
    expect(selectRecentMeetings(items, 2).map((i) => i.id)).toEqual(['b', 'c'])
  })

  it('limite maior que a lista retorna todos os itens', () => {
    const items = [{ id: 'a', scheduledAt: new Date('2026-01-01') }]
    expect(selectRecentMeetings(items, 10).map((i) => i.id)).toEqual(['a'])
  })
})

describe('selectRecentMeetingsPerGroup', () => {
  it('aplica o limite de forma independente para cada grupo', () => {
    const items = [
      { id: 'a1', groupId: 'A', scheduledAt: new Date('2026-01-01') },
      { id: 'a2', groupId: 'A', scheduledAt: new Date('2026-02-01') },
      { id: 'a3', groupId: 'A', scheduledAt: new Date('2026-03-01') },
      { id: 'b1', groupId: 'B', scheduledAt: new Date('2026-01-01') },
    ]
    const result = selectRecentMeetingsPerGroup(items, 2)
    const ids = result.map((i) => i.id).sort()
    expect(ids).toEqual(['a2', 'a3', 'b1'])
  })
})
