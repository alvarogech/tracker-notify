import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { getCallerGroupId } from '@/lib/auth/group-scope'
import { createAdminClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { isReportWithinDeadline } from '@/lib/business-rules/absences'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Reuniões' }

type MeetingStatus = 'scheduled' | 'completed' | 'cancelled'

interface Meeting {
  id: string
  scheduled_at: string
  status: MeetingStatus
  report_submitted_at: string | null
  notes: string | null
}

function StatusBadge({ meeting }: { meeting: Meeting }) {
  const { status, scheduled_at, report_submitted_at } = meeting

  if (status === 'cancelled') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        Cancelada
      </span>
    )
  }

  if (status === 'completed' && report_submitted_at) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Relatório enviado
      </span>
    )
  }

  if (status === 'scheduled') {
    const withinDeadline = isReportWithinDeadline(parseISO(scheduled_at), new Date())
    const isPast = new Date() > parseISO(scheduled_at)

    if (isPast && !withinDeadline) {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Prazo encerrado
        </span>
      )
    }

    if (isPast) {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Pendente
        </span>
      )
    }

    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        Agendada
      </span>
    )
  }

  return null
}

export default async function ReunioesPage() {
  const profile = await requireRole(['leader', 'cooperator'])
  const admin = createAdminClient()
  const groupId = await getCallerGroupId(profile)

  const meetings: Meeting[] = []
  if (groupId) {
    const { data } = await admin
      .from('meetings')
      .select('id, scheduled_at, status, report_submitted_at, notes')
      .eq('group_id', groupId)
      .order('scheduled_at', { ascending: false })

    if (data) {
      meetings.push(...(data as Meeting[]))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reuniões</h1>
        <Link
          href="/reunioes/nova"
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nova Reunião
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
          Nenhuma reunião registrada. Crie a primeira reunião do seu GR.
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/reunioes/${meeting.id}`}
              className="block rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">
                    {format(parseISO(meeting.scheduled_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  {meeting.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                      {meeting.notes}
                    </p>
                  )}
                </div>
                <StatusBadge meeting={meeting} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
