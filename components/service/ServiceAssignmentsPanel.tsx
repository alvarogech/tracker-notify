'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { startServiceAssignment, endServiceAssignment } from '@/app/(leader)/pessoas/[id]/servico-actions'

interface MinistryAreaOption {
  id: string
  name: string
}

interface ServiceAssignmentSummary {
  id: string
  areaName: string
  startedAt: string
  endedAt: string | null
}

interface ServiceAssignmentsPanelProps {
  personId: string
  eligibleToServe: boolean
  activeAssignments: ServiceAssignmentSummary[]
  history: ServiceAssignmentSummary[]
  areaOptions: MinistryAreaOption[]
}

type ActionResult = { error: string } | { success: true } | undefined

export function ServiceAssignmentsPanel({
  personId,
  eligibleToServe,
  activeAssignments,
  history,
  areaOptions,
}: ServiceAssignmentsPanelProps) {
  const [selected, setSelected] = useState(areaOptions[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function runAction(action: () => Promise<ActionResult>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Serviço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAssignments.length > 0 ? (
          <ul className="space-y-2">
            {activeAssignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Wrench size={15} className="text-muted-foreground" />
                  <div>
                    <p className="font-medium">{assignment.areaName}</p>
                    <p className="text-xs text-muted-foreground">
                      Desde {formatDate(assignment.startedAt)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() => runAction(() => endServiceAssignment(assignment.id))}
                >
                  <XCircle size={14} />
                  Encerrar
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum vínculo de serviço ativo.</p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {eligibleToServe ? (
          areaOptions.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Iniciar novo vínculo</p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {areaOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={isPending || !selected}
                  onClick={() => runAction(() => startServiceAssignment(personId, selected))}
                >
                  Iniciar
                </Button>
              </div>
            </div>
          )
        ) : (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Cultura Emaús concluído é necessário para iniciar um novo vínculo de serviço.
          </p>
        )}

        {history.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico
            </p>
            <ul className="space-y-1.5">
              {history.map((item) => (
                <li key={item.id} className="text-xs text-muted-foreground">
                  {item.areaName} · {formatDate(item.startedAt)}
                  {item.endedAt ? ` até ${formatDate(item.endedAt)}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
