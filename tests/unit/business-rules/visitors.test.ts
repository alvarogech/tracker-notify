import { describe, it, expect } from 'vitest'
import {
  countVisits,
  shouldSuggestConversion,
  isDuplicatePhone,
  isSimilarName,
  findDuplicatePhoneMatch,
  findSimilarNameMatches,
  type VisitorVisit,
} from '@/lib/business-rules/visitors'

function makeVisit(daysAgo: number): VisitorVisit {
  return { visitedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) }
}

describe('countVisits + shouldSuggestConversion', () => {
  it('0 visitas → contagem 0, sem sugestão', () => {
    const visits: VisitorVisit[] = []
    const count = countVisits(visits)
    expect(count).toBe(0)
    expect(shouldSuggestConversion(count)).toBe(false)
  })

  it('1 a 2 visitas → sem sugestão', () => {
    expect(shouldSuggestConversion(countVisits([makeVisit(10)]))).toBe(false)
    expect(shouldSuggestConversion(countVisits([makeVisit(20), makeVisit(10)]))).toBe(false)
  })

  it('exatamente 3 visitas → sugestão true', () => {
    const visits = [makeVisit(30), makeVisit(20), makeVisit(10)]
    const count = countVisits(visits)
    expect(count).toBe(3)
    expect(shouldSuggestConversion(count)).toBe(true)
  })

  it('visitas não consecutivas no tempo ainda contam normalmente, e mais de 3 continua sugerindo', () => {
    const visits = [makeVisit(90), makeVisit(45), makeVisit(3)]
    const count = countVisits(visits)
    expect(count).toBe(3)
    expect(shouldSuggestConversion(count)).toBe(true)

    const moreVisits = [...visits, makeVisit(1)]
    expect(shouldSuggestConversion(countVisits(moreVisits))).toBe(true)
  })
})

describe('isDuplicatePhone', () => {
  it('mesmo telefone com formatação diferente é duplicado', () => {
    expect(isDuplicatePhone('+55 62 99111-0001', '5562991110001')).toBe(true)
  })

  it('telefones diferentes não são duplicados; telefone vazio nunca é duplicado', () => {
    expect(isDuplicatePhone('+5562991110001', '+5562991110002')).toBe(false)
    expect(isDuplicatePhone('', '+5562991110001')).toBe(false)
  })

  it('findDuplicatePhoneMatch encontra a pessoa correspondente na lista', () => {
    const people = [
      { id: '1', phone: '+5562991110001' },
      { id: '2', phone: '+5562991110002' },
    ]
    const match = findDuplicatePhoneMatch('5562991110002', people)
    expect(match?.id).toBe('2')
  })
})

describe('isSimilarName', () => {
  it('nomes idênticos (ignorando acentos e caixa) ou um contido no outro são similares', () => {
    expect(isSimilarName('João da Silva', 'joao da silva')).toBe(true)
    expect(isSimilarName('Maria Souza', 'Maria Souza Pereira')).toBe(true)
  })

  it('nomes completamente diferentes não são similares', () => {
    expect(isSimilarName('Carlos Alberto', 'Fernanda Lima')).toBe(false)
  })

  it('findSimilarNameMatches retorna apenas pessoas semelhantes', () => {
    const people = [
      { id: '1', fullName: 'Ana Paula Ribeiro' },
      { id: '2', fullName: 'Bruno Costa' },
    ]
    const matches = findSimilarNameMatches('Ana Paula', people)
    expect(matches.map((p) => p.id)).toEqual(['1'])
  })
})
