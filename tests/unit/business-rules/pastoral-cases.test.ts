import { describe, it, expect } from 'vitest'
import { shouldCreateCase, shouldEscalate, canResolveCase } from '@/lib/business-rules/pastoral-cases'

describe('shouldCreateCase', () => {
  it('sem caso aberto e streak 1 → não cria caso', () => {
    expect(shouldCreateCase(1, false)).toBe(false)
  })

  it('sem caso aberto e streak 2 → cria caso', () => {
    expect(shouldCreateCase(2, false)).toBe(true)
  })

  it('caso já aberto e streak 3 → não cria novo caso (idempotente)', () => {
    expect(shouldCreateCase(3, true)).toBe(false)
  })

  it('caso já aberto e streak 2 novamente → não duplica', () => {
    expect(shouldCreateCase(2, true)).toBe(false)
  })

  it('streak 0 (sem sequência) → nunca cria caso', () => {
    expect(shouldCreateCase(0, false)).toBe(false)
  })
})

describe('shouldEscalate', () => {
  it('caso aberto e streak 4 → escala', () => {
    expect(shouldEscalate(4, true, false)).toBe(true)
  })

  it('sem caso aberto e streak 4 → não escala (não há caso para escalar)', () => {
    expect(shouldEscalate(4, false, false)).toBe(false)
  })

  it('caso aberto, streak 3 → ainda não escala (só na streak exata 4)', () => {
    expect(shouldEscalate(3, true, false)).toBe(false)
  })

  it('já escalado e streak permanece 4 → não reescala', () => {
    expect(shouldEscalate(4, true, true)).toBe(false)
  })
})

describe('canResolveCase', () => {
  it('0 ações registradas → resolução bloqueada', () => {
    expect(canResolveCase(0)).toBe(false)
  })

  it('1 ação registrada → resolução permitida', () => {
    expect(canResolveCase(1)).toBe(true)
  })

  it('múltiplas ações registradas → resolução permitida', () => {
    expect(canResolveCase(5)).toBe(true)
  })
})

describe('presença posterior não resolve automaticamente um caso (5.7)', () => {
  it('streak volta a 0 após presença, mas caso aberto continua exigindo ação explícita para resolver', () => {
    // O motor de ausências (absences.ts) zera o streak após uma presença,
    // mas essa biblioteca não expõe nenhuma função que resolva um caso a
    // partir do streak — resolução depende exclusivamente de ações registradas.
    const streakAfterPresence = 0
    expect(shouldCreateCase(streakAfterPresence, true)).toBe(false)
    expect(shouldEscalate(streakAfterPresence, true, false)).toBe(false)
    expect(canResolveCase(0)).toBe(false)
  })
})
