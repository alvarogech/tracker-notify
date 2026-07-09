'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HandHeart, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { addCooperator, removeCooperator } from '@/app/(leader)/pessoas/[id]/papeis-actions'

interface CooperatorsPanelProps {
  personId: string
  groupId: string
  isActiveCooperator: boolean
  activeCooperatorAssignmentId: string | null
  activeCooperatorStartedAt: string | null
}

type ActionResult = { error: string } | { success: true } | undefined

export function CooperatorsPanel({
  personId,
  groupId,
  isActiveCooperator,
  activeCooperatorAssignmentId,
  activeCooperatorStartedAt,
}: CooperatorsPanelProps) {
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
        <CardTitle className="text-sm">Cooperador do GR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActiveCooperator ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <HandHeart size={15} className="text-muted-foreground" />
              <span>Esta pessoa é cooperadora ativa do GR.</span>
            </div>
            {activeCooperatorStartedAt && (
              <p className="text-xs text-muted-foreground">
                Desde {formatDate(activeCooperatorStartedAt)}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending || !activeCooperatorAssignmentId}
              onClick={() =>
                activeCooperatorAssignmentId &&
                runAction(() => removeCooperator(activeCooperatorAssignmentId))
              }
            >
              <XCircle size={14} />
              Remover
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Esta pessoa não é cooperadora do GR.</p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runAction(() => addCooperator(personId, groupId))}
            >
              <HandHeart size={14} />
              Marcar como cooperador
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
