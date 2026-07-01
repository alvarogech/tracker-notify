'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, UserCheck, UserX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  recordVisit,
  confirmConversion,
  closeVisitorRelationship,
} from '@/app/(leader)/pessoas/[id]/visitante-actions'

interface VisitorPanelProps {
  relationshipId: string
  visitCount: number
  suggestConversion: boolean
}

export function VisitorPanel({ relationshipId, visitCount, suggestConversion }: VisitorPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [postponed, setPostponed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function runAction(action: () => Promise<{ error: string } | { success: true } | undefined>) {
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

  const showSuggestion = suggestConversion && !postponed

  return (
    <div className="space-y-4">
      {showSuggestion && (
        <div className="space-y-3 rounded-xl border border-status-info/30 bg-status-info/10 p-4">
          <p className="text-sm font-medium text-status-info">
            Esta pessoa já teve {visitCount} visitas. Deseja vincular como membro do GR?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runAction(() => confirmConversion(relationshipId))}
            >
              Confirmar vinculação
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setPostponed(true)}
            >
              Adiar
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Visitas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {visitCount} {visitCount === 1 ? 'visita registrada' : 'visitas registradas'}
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runAction(() => recordVisit(relationshipId))}
            >
              <CalendarPlus size={14} />
              Registrar visita
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runAction(() => confirmConversion(relationshipId))}
            >
              <UserCheck size={14} />
              Vincular como membro
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => runAction(() => closeVisitorRelationship(relationshipId))}
            >
              <UserX size={14} />
              Encerrar relação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
