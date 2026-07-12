export interface ImportRow {
  full_name: string
  phone: string
  email: string
  birthdate: string
  type: 'member' | 'visitor'
}

type ImportField = keyof ImportRow

const HEADER_SYNONYMS: Record<ImportField, string[]> = {
  full_name: ['nome', 'nome completo', 'name'],
  phone: ['telefone', 'celular', 'fone', 'whatsapp', 'phone'],
  email: ['email', 'e-mail'],
  birthdate: ['nascimento', 'data de nascimento', 'aniversario', 'birthdate'],
  type: ['tipo', 'vinculo', 'type'],
}

const DEFAULT_COLUMN_ORDER: ImportField[] = ['full_name', 'phone', 'email', 'birthdate', 'type']

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeHeaderCell(cell: string): string {
  return stripAccents(cell).trim().toLowerCase()
}

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t'
  if (line.includes(';')) return ';'
  return ','
}

function splitLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'))
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  let normalized = digits
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    normalized = digits
  } else if (digits.length === 10 || digits.length === 11) {
    normalized = '55' + digits
  } else {
    return ''
  }

  const candidate = '+' + normalized
  return /^\+55\d{10,11}$/.test(candidate) ? candidate : ''
}

export function normalizeBirthdate(raw: string): string {
  const value = raw.trim()
  if (!value) return ''

  const br = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (br) {
    const [, d, m, y] = br
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return ''
}

export function normalizeType(raw: string): 'member' | 'visitor' {
  const value = normalizeHeaderCell(raw)
  return value.startsWith('visit') ? 'visitor' : 'member'
}

function detectColumnOrder(headerLine: string, delimiter: string): (ImportField | null)[] | null {
  const cells = splitLine(headerLine, delimiter).map(normalizeHeaderCell)
  const mapped: (ImportField | null)[] = cells.map((cell) => {
    for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS) as [ImportField, string[]][]) {
      if (synonyms.includes(cell)) return field
    }
    return null
  })
  return mapped.includes('full_name') ? mapped : null
}

export function parseImportText(text: string, hasHeader: boolean): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  let columnOrder: (ImportField | null)[] = DEFAULT_COLUMN_ORDER
  let dataLines = lines

  if (hasHeader) {
    const detected = detectColumnOrder(lines[0], delimiter)
    if (detected) columnOrder = detected
    dataLines = lines.slice(1)
  }

  return dataLines
    .map((line) => {
      const cells = splitLine(line, delimiter)
      const raw: Partial<Record<ImportField, string>> = {}
      columnOrder.forEach((field, i) => {
        if (field) raw[field] = cells[i] ?? ''
      })

      return {
        full_name: (raw.full_name ?? '').trim(),
        phone: normalizePhone(raw.phone ?? ''),
        email: (raw.email ?? '').trim(),
        birthdate: normalizeBirthdate(raw.birthdate ?? ''),
        type: normalizeType(raw.type ?? 'membro'),
      }
    })
    .filter((row) => row.full_name.length > 0)
}
