'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { parseImportText, type ImportRow } from '@/lib/people/import'
import { importPeopleAction } from '@/app/(admin)/admin/pessoas/importar/actions'
import { UploadCloud } from 'lucide-react'

interface Group {
  id: string
  name: string
  location: string | null
}

interface Props {
  groups: Group[]
}

export function ImportPeopleForm({ groups }: Props) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [text, setText] = useState('')
  const [hasHeader, setHasHeader] = useState(true)
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [result, setResult] = useState<{ imported: number; errors: { line: number; reason: string }[] } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const preview = useMemo(() => (rows ?? []).slice(0, 20), [rows])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setText(String(reader.result ?? ''))
      setRows(null)
      setResult(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleAnalyze() {
    setRows(parseImportText(text, hasHeader))
    setResult(null)
  }

  function handleImport() {
    if (!rows || rows.length === 0) return
    startTransition(async () => {
      const res = await importPeopleAction(groupId, rows)
      setResult(res)
      if (res.imported > 0) {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="group_id">GR de destino *</Label>
        <select
          id="group_id"
          value={groupId}
          onChange={(e) => {
            setGroupId(e.target.value)
            setResult(null)
          }}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {groups.length === 0 && <option value="">Nenhum GR ativo</option>}
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
              {g.location ? ` — ${g.location}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3 text-sm text-muted-foreground">
        <p>
          Colunas esperadas (nessa ordem, se não tiver cabeçalho): <strong>Nome completo</strong>,{' '}
          <strong>Telefone</strong>, <strong>Email</strong>, <strong>Data de nascimento</strong>,{' '}
          <strong>Tipo</strong> (membro/visitante). Só o nome é obrigatório.
        </p>
        <p>
          Selecione o intervalo na sua planilha, copie (Ctrl+C) e cole aqui embaixo (Ctrl+V) — ou envie um arquivo
          CSV exportado da planilha.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="paste">Dados</Label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <UploadCloud size={14} />
            Enviar arquivo CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        </div>
        <textarea
          id="paste"
          rows={10}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setRows(null)
            setResult(null)
          }}
          placeholder={'Maria Silva\t+5562912345678\tmaria@email.com\t15/03/1990\tmembro'}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
        A primeira linha é um cabeçalho (nomes das colunas)
      </label>

      <Button type="button" variant="outline" className="w-full" onClick={handleAnalyze} disabled={!text.trim()}>
        Analisar
      </Button>

      {rows && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{rows.length} pessoa(s) reconhecida(s)</p>

          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">Telefone</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Nascimento</th>
                    <th className="p-2 text-left">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.full_name}</td>
                      <td className="p-2">{r.phone || '—'}</td>
                      <td className="p-2">{r.email || '—'}</td>
                      <td className="p-2">{r.birthdate || '—'}</td>
                      <td className="p-2">{r.type === 'visitor' ? 'Visitante' : 'Membro'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > preview.length && (
                <p className="p-2 text-center text-xs text-muted-foreground">
                  Mostrando as primeiras {preview.length} de {rows.length} linhas.
                </p>
              )}
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={handleImport}
            disabled={isPending || rows.length === 0 || !groupId}
          >
            {isPending ? 'Importando…' : `Importar ${rows.length} pessoa(s)`}
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
          {result.imported > 0 && (
            <p className="font-medium text-huios-green">{result.imported} pessoa(s) importada(s) com sucesso.</p>
          )}
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium text-destructive">{result.errors.length} linha(s) com problema:</p>
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    {e.line > 0 ? `Linha ${e.line}: ` : ''}
                    {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
