'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { markProgramCompleted } from '@/app/(leader)/pessoas/[id]/formacao-actions'
import { ELIGIBILITY_SERVE_LABEL, ELIGIBILITY_LEADER_LABEL } from '@/lib/business-rules/eligibility'

interface ProgramStatus {
  code: string
  name: string
  completedAt: string | null
}

interface TrainingPanelProps {
  personId: string
  programs: ProgramStatus[]
  eligibleToServe: boolean
  eligibleToLeadFormatively: boolean
}

type ActionResult = { error: string } | { success: true } | undefined

export function TrainingPanel({
  personId,
  programs,
  eligibleToServe,
  eligibleToLeadFormatively,
}: TrainingPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function markCompleted(programCode: string) {
    setError(null)
    startTransition(async () => {
      const result: ActionResult = await markProgramCompleted(personId, programCode)
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
        <CardTitle className="text-sm">Formação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <ul className="space-y-2">
          {programs.map((program) => (
            <li
              key={program.code}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="flex items-center gap-2 text-sm">
                {program.completedAt ? (
                  <CheckCircle2 size={16} className="text-primary" />
                ) : (
                  <Circle size={16} className="text-muted-foreground" />
                )}
                <span>{program.name}</span>
              </div>
              {program.completedAt ? (
                <span className="text-xs text-muted-foreground">
                  Concluído em {formatDate(program.completedAt)}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => markCompleted(program.code)}
                >
                  Marcar concluído
                </Button>
              )}
            </li>
          ))}
        </ul>

        {(eligibleToServe || eligibleToLeadFormatively) && (
          <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
            {eligibleToServe && <p>{ELIGIBILITY_SERVE_LABEL}</p>}
            {eligibleToLeadFormatively && <p>{ELIGIBILITY_LEADER_LABEL}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
