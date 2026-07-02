'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createManualCase } from '@/app/(leader)/casos/actions'

interface ManualCaseButtonProps {
  personId: string
}

export function ManualCaseButton({ personId }: ManualCaseButtonProps) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createManualCase(personId, notes)
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      setExpanded(false)
      setNotes('')
      router.refresh()
    })
  }

  if (!expanded) {
    return (
      <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
        <AlertCircle size={14} />
        Abrir caso de pastoreio
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Motivo da abertura (opcional)"
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={submit}>
          Confirmar abertura
        </Button>
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setExpanded(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
