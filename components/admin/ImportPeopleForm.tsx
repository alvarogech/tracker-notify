'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { parseNames } from '@/lib/people/import'
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
  const [names, setNames] = useState<string[] | null>(null)
  const [result, setResult] = useState<{ imported: number; errors: { line: number; reason: string }[] } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setText(String(reader.result ?? ''))
      setNames(null)
      setResult(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleAnalyze() {
    setNames(parseNames(text))
    setResult(null)
  }

  function handleImport() {
    if (!names || names.length === 0) return
    startTransition(async () => {
      const res = await importPeopleAction(groupId, names)
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

      <div className="rounded-xl border bg-card p-4 space-y-2 text-sm text-muted-foreground">
        <p>
          Cole <strong>um nome por linha</strong> — copie só a coluna de nomes da sua planilha (Ctrl+C, Ctrl+V aqui
          embaixo) ou envie um arquivo CSV/TXT. Telefone, e-mail e data de nascimento cada líder completa depois,
          pessoa por pessoa.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="paste">Nomes</Label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <UploadCloud size={14} />
            Enviar arquivo
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        </div>
        <textarea
          id="paste"
          rows={12}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setNames(null)
            setResult(null)
          }}
          placeholder={'Maria Silva\nJoão Souza\nAna Paula'}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={handleAnalyze} disabled={!text.trim()}>
        Analisar
      </Button>

      {names && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{names.length} nome(s) reconhecido(s)</p>

          {names.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <ul className="divide-y text-sm">
                {names.map((name, i) => (
                  <li key={i} className="px-3 py-1.5">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={handleImport}
            disabled={isPending || names.length === 0 || !groupId}
          >
            {isPending ? 'Importando…' : `Importar ${names.length} pessoa(s)`}
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
