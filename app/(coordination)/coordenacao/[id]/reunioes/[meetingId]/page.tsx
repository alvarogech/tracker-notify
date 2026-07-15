import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { requireRole } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/server'
import { computeAbsenceStreak, isReportWithinDeadline, type MeetingAttendance } from '@/lib/business-rules/absences'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Detalhe da Reunião' }

interface MeetingRow {
  id: string
  group_id: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string | null
  report_submitted_at: string | null
  groups: { name: string } | null
}

interface MemberRow {
  person_id: string
  people: { id: string; full_name: string } | null
}

interface AttendanceRow {
  person_id: string
  status: string
}

interface HistoryMeetingRow {
  id: string
  scheduled_at: string
  status: string
  report_submitted_at: string | null
  attendance_records: { person_id: string; status: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  present: 'Presente',
  absent: 'Ausente',
  excused: 'Justificado',
  on_leave: 'Afastado',
}

function formatScheduled(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export default async function CoordinationMeetingDetailPage({
  params,
}: {
  params: { id: string; meetingId: string }
}) {
  await requireRole(['coordinator', 'admin'])
  const admin = createAdminClient()

  const { data: meetingData } = await admin
    .from('meetings')
    .select('id, group_id, scheduled_at, status, notes, report_submitted_at, groups(name)')
    .eq('id', params.meetingId)
    .single()

  const meeting = meetingData as unknown as MeetingRow | null
  if (!meeting || meeting.group_id !== params.id) notFound()

  const backHref = `/coordenacao/${params.id}`

  if (meeting.status === 'cancelled') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Reunião</h1>
        </div>
        <div className="space-y-2 rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">{formatScheduled(meeting.scheduled_at)}</p>
          <Badge variant="outline" className="text-muted-foreground">
            Reunião cancelada
          </Badge>
        </div>
      </div>
    )
  }

  const { data: membersData } = await admin
    .from('group_relationships')
    .select('person_id, people(id, full_name)')
    .eq('group_id', meeting.group_id)
    .eq('status', 'active')
    .eq('type', 'member')

  const members = (membersData ?? []) as unknown as MemberRow[]

  const { data: attendanceData } = await admin
    .from('attendance_records')
    .select('person_id, status')
    .eq('meeting_id', meeting.id)

  const attendance = (attendanceData ?? []) as AttendanceRow[]
  const attendanceMap = new Map(attendance.map((a) => [a.person_id, a.status]))

  const withinDeadline = isReportWithinDeadline(parseISO(meeting.scheduled_at), new Date())
  const isSubmitted = meeting.report_submitted_at !== null

  const streakMap = new Map<string, number>()
  if (isSubmitted) {
    const { data: historyData } = await admin
      .from('meetings')
      .select('id, scheduled_at, status, report_submitted_at, attendance_records(person_id, status)')
      .eq('group_id', meeting.group_id)
      .order('scheduled_at', { ascending: true })

    const history = (historyData ?? []) as unknown as HistoryMeetingRow[]

    for (const member of members) {
      const personId = member.person_id
      const meetingHistory: MeetingAttendance[] = history.map((h) => {
        const rec = h.attendance_records.find((ar) => ar.person_id === personId)
        return {
          scheduledAt: parseISO(h.scheduled_at),
          meetingStatus: h.status === 'cancelled' ? 'cancelled' : 'completed',
          reportSubmittedAt: h.report_submitted_at ? parseISO(h.report_submitted_at) : null,
          attendanceStatus: rec ? (rec.status as MeetingAttendance['attendanceStatus']) : null,
        }
      })
      streakMap.set(personId, computeAbsenceStreak(meetingHistory))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Reunião</h1>
          {meeting.groups && <p className="text-sm text-muted-foreground">{meeting.groups.name}</p>}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-5">
        <p className="font-medium">{formatScheduled(meeting.scheduled_at)}</p>
        {meeting.notes && <p className="text-sm text-muted-foreground">{meeting.notes}</p>}
        {isSubmitted && (
          <Badge variant="success" className="text-xs">
            Relatório enviado
          </Badge>
        )}
        {!isSubmitted && !withinDeadline && (
          <Badge variant="danger" className="text-xs">
            Prazo encerrado
          </Badge>
        )}
        {!isSubmitted && withinDeadline && (
          <Badge variant="warning" className="text-xs">
            Aguardando relatório
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Frequência</h2>
        <div className="divide-y rounded-xl border bg-card">
          {members.map((m) => {
            const streak = streakMap.get(m.person_id) ?? 0
            const status = attendanceMap.get(m.person_id)
            return (
              <div key={m.person_id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {streak >= 2 && <AlertTriangle size={15} className="shrink-0 text-status-warning" />}
                  <span className="text-sm">{m.people?.full_name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {status ? (
                    <span className="text-xs text-muted-foreground">{STATUS_LABEL[status] ?? status}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                  {streak > 0 && (
                    <span className="text-xs font-medium text-status-warning">
                      {streak} falta{streak > 1 ? 's' : ''} seguida{streak > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {members.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum membro neste GR.</p>
          )}
        </div>
      </div>
    </div>
  )
}
