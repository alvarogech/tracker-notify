'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { saveDraftAttendance, submitReport } from '../actions'

type AttendanceStatus = 'present' | 'absent' | 'excused' | 'on_leave'

interface Member {
  personId: string
  fullName: string
}

interface Props {
  meetingId: string
  members: Member[]
  initialAttendance: Record<string, string>
  withinDeadline: boolean
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Presente' },
  { value: 'absent', label: 'Ausente' },
  { value: 'excused', label: 'Justificado' },
  { value: 'on_leave', label: 'Afastado' },
]

export function AttendanceForm({ meetingId, members, initialAttendance, withinDeadline }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
    () => {
      const init: Record<string, AttendanceStatus> = {}
      for (const [k, v] of Object.entries(initialAttendance)) {
        init[k] = v as AttendanceStatus
      }
      return init
    }
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function setStatus(personId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [personId]: status }))
    setSaved(false)
  }

  const records = Object.entries(attendance).map(([personId, status]) => ({ personId, status }))
  const hasRecords = records.length > 0

  function handleSaveDraft() {
    setError(null)
    startTransition(async () => {
      const result = await saveDraftAttendance(meetingId, records)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        router.refresh()
      }
    })
  }

  function handleSubmitReport() {
    setError(null)
    startTransition(async () => {
      const result = await submitReport(meetingId)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/reunioes')
        router.refresh()
      }
    })
  }

  if (!withinDeadline) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        O prazo de 48 horas para envio do relatório encerrou.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Chamada</h2>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum membro ativo neste GR.</p>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {members.map((m) => (
            <div key={m.personId} className="flex items-center justify-between px-4 py-3 gap-3">
              <span className="text-sm font-medium flex-1">{m.fullName}</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(m.personId, opt.value)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      attendance[m.personId] === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {saved && !error && (
        <p className="text-sm text-green-600 text-center">Chamada salva.</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isPending || !hasRecords}
          onClick={handleSaveDraft}
        >
          {isPending ? 'Salvando…' : 'Salvar rascunho'}
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isPending || !hasRecords}
          onClick={handleSubmitReport}
        >
          {isPending ? 'Enviando…' : 'Enviar relatório'}
        </Button>
      </div>
    </div>
  )
}
