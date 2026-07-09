'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Home, UserMinus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { assignHost, endHostAssignment } from '@/app/(leader)/pessoas/[id]/papeis-actions'

interface HostPanelProps {
  personId: string
  groupId: string
  isCurrentHost: boolean
  activeHostAssignmentId: string | null
  activeHostName: string | null
  activeHostStartedAt: string | null
}

type ActionResult = { error: string } | { success: true } | undefined

export function HostPanel({
  personId,
  groupId,
  isCurrentHost,
  activeHostAssignmentId,
  activeHostName,
  activeHostStartedAt,
}: HostPanelProps) {
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
        <CardTitle className="text-sm">Anfitrião do GR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCurrentHost ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Home size={15} className="text-muted-foreground" />
              <span>Esta pessoa é a anfitriã atual do GR.</span>
            </div>
            {activeHostStartedAt && (
              <p className="text-xs text-muted-foreground">Desde {formatDate(activeHostStartedAt)}</p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending || !activeHostAssignmentId}
              onClick={() =>
                activeHostAssignmentId && runAction(() => endHostAssignment(activeHostAssignmentId))
              }
            >
              <UserMinus size={14} />
              Encerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {activeHostName
                ? `Anfitrião atual do GR: ${activeHostName}.`
                : 'Nenhum anfitrião ativo neste GR.'}
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runAction(() => assignHost(personId, groupId))}
            >
              <Home size={14} />
              {activeHostName ? 'Marcar como anfitrião (substitui atual)' : 'Marcar como anfitrião'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
