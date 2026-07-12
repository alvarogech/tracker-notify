import { describe, it, expect } from 'vitest'
import { normalizePhone, normalizeBirthdate, normalizeType, parseImportText } from '@/lib/people/import'

describe('normalizePhone', () => {
  it('adiciona +55 a um número de 11 dígitos', () => {
    expect(normalizePhone('62912345678')).toBe('+5562912345678')
  })

  it('lida com formatação (parênteses, espaços, hífen)', () => {
    expect(normalizePhone('(62) 91234-5678')).toBe('+5562912345678')
  })

  it('mantém um número que já tem código do país', () => {
    expect(normalizePhone('5562912345678')).toBe('+5562912345678')
  })

  it('retorna vazio para número inválido em vez de travar a linha', () => {
    expect(normalizePhone('123')).toBe('')
    expect(normalizePhone('')).toBe('')
  })
})

describe('normalizeBirthdate', () => {
  it('converte dd/mm/aaaa para aaaa-mm-dd', () => {
    expect(normalizeBirthdate('15/03/1990')).toBe('1990-03-15')
  })

  it('mantém aaaa-mm-dd já no formato certo', () => {
    expect(normalizeBirthdate('1990-03-15')).toBe('1990-03-15')
  })

  it('retorna vazio para data não reconhecida', () => {
    expect(normalizeBirthdate('data desconhecida')).toBe('')
  })
})

describe('normalizeType', () => {
  it('reconhece variações de "visitante"', () => {
    expect(normalizeType('visitante')).toBe('visitor')
    expect(normalizeType('Visitor')).toBe('visitor')
  })

  it('padrão é membro para qualquer outro valor', () => {
    expect(normalizeType('membro')).toBe('member')
    expect(normalizeType('')).toBe('member')
  })
})

describe('parseImportText', () => {
  it('lê linhas separadas por tab (colar do Excel/Sheets), sem cabeçalho', () => {
    const text = 'Maria Silva\t62912345678\tmaria@email.com\t15/03/1990\tmembro'
    const rows = parseImportText(text, false)
    expect(rows).toEqual([
      { full_name: 'Maria Silva', phone: '+5562912345678', email: 'maria@email.com', birthdate: '1990-03-15', type: 'member' },
    ])
  })

  it('detecta colunas pelo cabeçalho, mesmo fora de ordem', () => {
    const text = 'Telefone;Nome;Tipo\n62912345678;João Souza;visitante'
    const rows = parseImportText(text, true)
    expect(rows).toEqual([
      { full_name: 'João Souza', phone: '+5562912345678', email: '', birthdate: '', type: 'visitor' },
    ])
  })

  it('ignora linhas sem nome', () => {
    const text = 'Nome,Telefone\nAna Paula,62999998888\n,62999997777'
    const rows = parseImportText(text, true)
    expect(rows).toHaveLength(1)
    expect(rows[0].full_name).toBe('Ana Paula')
  })

  it('retorna lista vazia para texto vazio', () => {
    expect(parseImportText('', false)).toEqual([])
  })
})
