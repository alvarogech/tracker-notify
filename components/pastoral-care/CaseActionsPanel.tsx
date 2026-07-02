'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { logAction, resolveCase } from '@/app/(leader)/casos/actions'

type ActionResult = { error: string } | { success: true } | undefined

interface CaseActionsPanelProps {
  caseId: string
  canResolve: boolean
  isOpen: boolean
}

export function CaseActionsPanel({ caseId, canResolve, isOpen }: CaseActionsPanelProps) {
  const [description, setDescription] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function runAction(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      onSuccess?.()
      router.refresh()
    })
  }

  if (!isOpen) return null

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <Label htmlFor="description">Registrar ação</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Ligação realizada em 02/07"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          size="sm"
          disabled={isPending || description.trim().length < 3}
          onClick={() =>
            runAction(() => logAction(caseId, description), () => setDescription(''))
          }
        >
          <Send size={14} />
          Registrar
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-5">
        <Label htmlFor="resolution_notes">Resolver caso</Label>
        <textarea
          id="resolution_notes"
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Resultado factual (opcional)"
          rows={2}
          disabled={!canResolve}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {!canResolve && (
          <p className="text-xs text-muted-foreground">
            Registre ao menos uma ação antes de resolver o caso.
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={isPending || !canResolve}
          onClick={() => runAction(() => resolveCase(caseId, resolutionNotes))}
        >
          <CheckCircle2 size={14} />
          Marcar como resolvido
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
