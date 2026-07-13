export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    // tolera colar de uma planilha com mais colunas — usa só a primeira célula
    .map((line) => line.split(/\t|;|,/)[0] ?? '')
    .map((name) => name.trim().replace(/^"(.*)"$/, '$1'))
    .filter((name) => name.length > 0)
}
