'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserMinus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { assignDiscipler, endDiscipleshipAssignment } from '@/app/(leader)/pessoas/[id]/discipulado-actions'

interface DisciplerOption {
  id: string
  fullName: string
}

interface AssignmentSummary {
  id: string
  disciplerName: string
  startedAt: string
  endedAt: string | null
}

interface DisciplershipPanelProps {
  personId: string
  activeAssignment: AssignmentSummary | null
  history: AssignmentSummary[]
  disciplerOptions: DisciplerOption[]
}

type ActionResult = { error: string } | { success: true } | undefined

export function DisciplershipPanel({
  personId,
  activeAssignment,
  history,
  disciplerOptions,
}: DisciplershipPanelProps) {
  const [selected, setSelected] = useState(disciplerOptions[0]?.id ?? '')
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
        <CardTitle className="text-sm">Discipulado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAssignment ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users size={15} className="text-muted-foreground" />
              <span>
                Discipulador atual: <strong>{activeAssignment.disciplerName}</strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Desde {formatDate(activeAssignment.startedAt)}
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => runAction(() => endDiscipleshipAssignment(activeAssignment.id))}
            >
              <UserMinus size={14} />
              Encerrar vínculo
            </Button>

            {disciplerOptions.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Substituir discipulador</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    aria-label="Substituir discipulador"
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {disciplerOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.fullName}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={isPending || !selected}
                    onClick={() => runAction(() => assignDiscipler(personId, selected))}
                  >
                    Substituir
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Nenhum discipulador atribuído.</p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {disciplerOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  aria-label="Atribuir discipulador"
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {disciplerOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.fullName}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={isPending || !selected}
                  onClick={() => runAction(() => assignDiscipler(personId, selected))}
                >
                  Atribuir discipulador
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum discipulador disponível para atribuição.
              </p>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico
            </p>
            <ul className="space-y-1.5">
              {history.map((item) => (
                <li key={item.id} className="text-xs text-muted-foreground">
                  {item.disciplerName} · {formatDate(item.startedAt)}
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
