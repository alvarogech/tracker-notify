import { describe, it, expect } from 'vitest'
import { parseNames } from '@/lib/people/import'

describe('parseNames', () => {
  it('lê um nome por linha', () => {
    expect(parseNames('Maria Silva\nJoão Souza\nAna Paula')).toEqual(['Maria Silva', 'João Souza', 'Ana Paula'])
  })

  it('ignora linhas em branco', () => {
    expect(parseNames('Maria Silva\n\n\nJoão Souza\n')).toEqual(['Maria Silva', 'João Souza'])
  })

  it('usa só a primeira célula se colarem várias colunas por engano', () => {
    expect(parseNames('Maria Silva\t62912345678\nJoão Souza;joao@email.com')).toEqual(['Maria Silva', 'João Souza'])
  })

  it('remove aspas envolvendo o nome (colagem de CSV)', () => {
    expect(parseNames('"Maria Silva"\n"João Souza"')).toEqual(['Maria Silva', 'João Souza'])
  })

  it('retorna lista vazia para texto vazio', () => {
    expect(parseNames('')).toEqual([])
  })
})
