'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { startServiceAssignments, endServiceAssignment } from '@/app/(leader)/pessoas/[id]/servico-actions'

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleSelected(areaId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(areaId)) next.delete(areaId)
      else next.add(areaId)
      return next
    })
  }

  function runAction(action: () => Promise<ActionResult>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      setSelected(new Set())
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Grupos de Atuação</CardTitle>
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
              <p className="text-xs font-medium text-muted-foreground">
                Iniciar novo vínculo — pode marcar mais de um grupo de atuação
              </p>
              <div className="space-y-1.5">
                {areaOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(option.id)}
                      onChange={() => toggleSelected(option.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {option.name}
                  </label>
                ))}
              </div>
              <Button
                size="sm"
                disabled={isPending || selected.size === 0}
                onClick={() => runAction(() => startServiceAssignments(personId, Array.from(selected)))}
              >
                Iniciar
              </Button>
            </div>
          )
        ) : (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Cultura Emaús concluído é necessário para iniciar um novo vínculo de atuação.
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
