import { describe, it, expect } from 'vitest'
import {
  resolveActiveHost,
  hasActiveHost,
  resolveActiveCooperators,
  isActiveCooperator,
} from '@/lib/business-rules/group-roles'

describe('resolveActiveHost', () => {
  it('lista vazia → nenhum anfitrião ativo', () => {
    expect(resolveActiveHost([])).toBeNull()
  })

  it('uma atribuição ativa → retorna essa atribuição', () => {
    const active = { personId: 'p1', startedAt: new Date('2026-01-01'), endedAt: null }
    expect(resolveActiveHost([active])).toEqual(active)
  })

  it('uma ativa entre atribuições encerradas → a ativa vence', () => {
    const closed = {
      personId: 'p1',
      startedAt: new Date('2026-01-01'),
      endedAt: new Date('2026-02-01'),
    }
    const active = { personId: 'p2', startedAt: new Date('2026-02-01'), endedAt: null }
    expect(resolveActiveHost([closed, active])).toEqual(active)
  })

  it('apenas atribuições encerradas → nenhum anfitrião ativo', () => {
    const closed = {
      personId: 'p1',
      startedAt: new Date('2026-01-01'),
      endedAt: new Date('2026-02-01'),
    }
    expect(resolveActiveHost([closed])).toBeNull()
    expect(hasActiveHost([closed])).toBe(false)
  })

  it('substituição em sequência → apenas a mais recente fica ativa', () => {
    const first = {
      personId: 'p1',
      startedAt: new Date('2026-01-01'),
      endedAt: new Date('2026-02-01'),
    }
    const second = { personId: 'p2', startedAt: new Date('2026-02-01'), endedAt: null }
    expect(resolveActiveHost([first, second])).toEqual(second)
    expect(hasActiveHost([first, second])).toBe(true)
  })
})

describe('resolveActiveCooperators / isActiveCooperator', () => {
  it('lista vazia → nenhum cooperador ativo', () => {
    expect(resolveActiveCooperators([])).toEqual([])
    expect(isActiveCooperator([])).toBe(false)
  })

  it('vários cooperadores ativos simultâneos → todos retornados (5.8 permite múltiplos)', () => {
    const a = { personId: 'p1', startedAt: new Date('2026-01-01'), endedAt: null }
    const b = { personId: 'p2', startedAt: new Date('2026-01-05'), endedAt: null }
    expect(resolveActiveCooperators([a, b])).toEqual([a, b])
    expect(isActiveCooperator([a, b])).toBe(true)
  })

  it('mistura de ativos e encerrados → apenas os ativos são retornados', () => {
    const active = { personId: 'p1', startedAt: new Date('2026-01-01'), endedAt: null }
    const closed = {
      personId: 'p2',
      startedAt: new Date('2025-12-01'),
      endedAt: new Date('2026-01-01'),
    }
    expect(resolveActiveCooperators([active, closed])).toEqual([active])
    expect(isActiveCooperator([active, closed])).toBe(true)
  })

  it('apenas cooperadores encerrados → nenhum ativo', () => {
    const closed = {
      personId: 'p1',
      startedAt: new Date('2025-12-01'),
      endedAt: new Date('2026-01-01'),
    }
    expect(resolveActiveCooperators([closed])).toEqual([])
    expect(isActiveCooperator([closed])).toBe(false)
  })
})
