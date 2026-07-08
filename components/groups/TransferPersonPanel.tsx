'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { transferPerson } from '@/app/(leader)/pessoas/[id]/transferencia-actions'

interface GroupOption {
  id: string
  name: string
}

interface TransferPersonPanelProps {
  personId: string
  currentGroupName: string
  groupOptions: GroupOption[]
  activeDisciplerName: string | null
}

type ActionResult = { error: string } | { success: true } | undefined
type DisciplerDecision = 'keep' | 'end' | 'none'

export function TransferPersonPanel({
  personId,
  currentGroupName,
  groupOptions,
  activeDisciplerName,
}: TransferPersonPanelProps) {
  const [toGroupId, setToGroupId] = useState(groupOptions[0]?.id ?? '')
  const [disciplerDecision, setDisciplerDecision] = useState<DisciplerDecision>(
    activeDisciplerName ? 'keep' : 'none'
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result: ActionResult = await transferPerson(personId, toGroupId, disciplerDecision, reason)
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      setReason('')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Transferência de GR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          GR atual: <strong className="text-foreground">{currentGroupName}</strong>
        </p>

        {groupOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum outro GR ativo disponível para transferência.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">GR de destino</p>
              <select
                value={toGroupId}
                onChange={(e) => setToGroupId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {groupOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {activeDisciplerName && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Discipulador atual: <strong className="text-foreground">{activeDisciplerName}</strong>
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="discipler-decision"
                      checked={disciplerDecision === 'keep'}
                      onChange={() => setDisciplerDecision('keep')}
                    />
                    Manter no novo GR
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="discipler-decision"
                      checked={disciplerDecision === 'end'}
                      onChange={() => setDisciplerDecision('end')}
                    />
                    Encerrar vínculo
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Motivo (opcional)</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Motivo da transferência"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button size="sm" disabled={isPending || !toGroupId} onClick={submit}>
              <ArrowLeftRight size={14} />
              Confirmar transferência
            </Button>
          </>
        )}

        {groupOptions.length === 0 && error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
