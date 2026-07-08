import { describe, it, expect } from 'vitest'
import { isEligibleToServe, isEligibleToLeadFormatively } from '@/lib/business-rules/eligibility'

describe('elegibilidade formativa', () => {
  it('nenhum programa concluído → não apto a servir', () => {
    expect(isEligibleToServe([])).toBe(false)
    expect(isEligibleToLeadFormatively([])).toBe(false)
  })

  it('apenas Cultura Emaús → apto a servir, não apto a liderar', () => {
    const completed = ['cultura_emaus']
    expect(isEligibleToServe(completed)).toBe(true)
    expect(isEligibleToLeadFormatively(completed)).toBe(false)
  })

  it('Cultura Emaús + Makarios 1 (parcial) → não apto a liderar', () => {
    const completed = ['cultura_emaus', 'makarios_1']
    expect(isEligibleToServe(completed)).toBe(true)
    expect(isEligibleToLeadFormatively(completed)).toBe(false)
  })

  it('os 4 programas concluídos → apto a servir e apto a liderar', () => {
    const completed = ['cultura_emaus', 'makarios_1', 'makarios_2', 'makarios_3']
    expect(isEligibleToServe(completed)).toBe(true)
    expect(isEligibleToLeadFormatively(completed)).toBe(true)
  })

  it('Makarios 1/2/3 concluídos fora de ordem, sem Cultura Emaús → não apto a servir', () => {
    const completed = ['makarios_1', 'makarios_2', 'makarios_3']
    expect(isEligibleToServe(completed)).toBe(false)
    expect(isEligibleToLeadFormatively(completed)).toBe(false)
  })

  it('entradas duplicadas não alteram o resultado', () => {
    const completed = ['cultura_emaus', 'cultura_emaus', 'makarios_1', 'makarios_1']
    expect(isEligibleToServe(completed)).toBe(true)
    expect(isEligibleToLeadFormatively(completed)).toBe(false)
  })

  it('entrada vazia ou com códigos desconhecidos → não apto a nada', () => {
    expect(isEligibleToServe([])).toBe(false)
    expect(isEligibleToLeadFormatively([])).toBe(false)
    expect(isEligibleToServe(['programa_inexistente'])).toBe(false)
    expect(isEligibleToLeadFormatively(['programa_inexistente'])).toBe(false)
  })
})
