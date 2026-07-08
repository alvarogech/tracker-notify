import { describe, it, expect } from 'vitest'
import { resolveActiveAssignment, hasActiveDiscipler } from '@/lib/business-rules/discipleship'

describe('resolveActiveAssignment', () => {
  it('lista vazia → nenhum discipulador ativo', () => {
    expect(resolveActiveAssignment([])).toBeNull()
  })

  it('uma atribuição ativa → retorna essa atribuição', () => {
    const active = { disciplerId: 'd1', startedAt: new Date('2026-01-01'), endedAt: null }
    expect(resolveActiveAssignment([active])).toEqual(active)
  })

  it('uma ativa entre atribuições encerradas → a ativa vence', () => {
    const closed = {
      disciplerId: 'd1',
      startedAt: new Date('2026-01-01'),
      endedAt: new Date('2026-02-01'),
    }
    const active = { disciplerId: 'd2', startedAt: new Date('2026-02-01'), endedAt: null }
    expect(resolveActiveAssignment([closed, active])).toEqual(active)
  })

  it('apenas atribuições encerradas → nenhum discipulador ativo', () => {
    const closed = {
      disciplerId: 'd1',
      startedAt: new Date('2026-01-01'),
      endedAt: new Date('2026-02-01'),
    }
    expect(resolveActiveAssignment([closed])).toBeNull()
  })

  it('múltiplas atribuições encerradas em sequência → ainda nenhuma ativa', () => {
    const first = {
      disciplerId: 'd1',
      startedAt: new Date('2026-01-01'),
      endedAt: new Date('2026-02-01'),
    }
    const second = {
      disciplerId: 'd2',
      startedAt: new Date('2026-02-01'),
      endedAt: new Date('2026-03-01'),
    }
    expect(resolveActiveAssignment([first, second])).toBeNull()
    expect(hasActiveDiscipler([first, second])).toBe(false)
  })
})
