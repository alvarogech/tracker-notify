import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { getCallerGroupId } from '@/lib/auth/group-scope'
import { createAdminClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { computeAbsenceStreak, isReportWithinDeadline, type MeetingAttendance } from '@/lib/business-rules/absences'
import { AttendanceForm } from './AttendanceForm'

export const metadata: Metadata = { title: 'Detalhe da Reunião' }

interface MeetingRow {
  id: string
  group_id: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string | null
  report_submitted_at: string | null
}

interface AttendanceRow {
  id: string
  person_id: string
  status: string
}

interface MemberRow {
  person_id: string
  type: string
  people: {
    id: string
    full_name: string
  } | null
}

interface HistoryMeetingRow {
  id: string
  scheduled_at: string
  status: string
  report_submitted_at: string | null
  attendance_records: { person_id: string; status: string }[]
}

function formatScheduled(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireRole(['leader', 'cooperator'])
  const admin = createAdminClient()
  const callerGroupId = await getCallerGroupId(profile)

  // Fetch meeting and verify ownership
  const { data: meetingData } = await admin
    .from('meetings')
    .select('id, group_id, scheduled_at, status, notes, report_submitted_at, groups!inner(leader_id)')
    .eq('id', params.id)
    .single()

  if (!meetingData) notFound()

  const raw = meetingData as unknown as MeetingRow & { groups: { leader_id: string } }
  if (!callerGroupId || raw.group_id !== callerGroupId) notFound()

  const meeting: MeetingRow = {
    id: raw.id,
    group_id: raw.group_id,
    scheduled_at: raw.scheduled_at,
    status: raw.status,
    notes: raw.notes,
    report_submitted_at: raw.report_submitted_at,
  }

  if (meeting.status === 'cancelled') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/reunioes" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Reunião</h1>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-2">
          <p className="text-muted-foreground text-sm">{formatScheduled(meeting.scheduled_at)}</p>
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Reunião cancelada
          </span>
        </div>
      </div>
    )
  }

  // Fetch active members of this group
  const { data: membersData } = await admin
    .from('group_relationships')
    .select('person_id, type, people(id, full_name)')
    .eq('group_id', meeting.group_id)
    .eq('status', 'active')
    .eq('type', 'member')

  const members = (membersData ?? []) as unknown as MemberRow[]

  // Fetch existing attendance records for this meeting
  const { data: attendanceData } = await admin
    .from('attendance_records')
    .select('id, person_id, status')
    .eq('meeting_id', meeting.id)

  const attendance = (attendanceData ?? []) as AttendanceRow[]
  const attendanceMap = new Map(attendance.map((a) => [a.person_id, a.status]))

  const withinDeadline = isReportWithinDeadline(parseISO(meeting.scheduled_at), new Date())
  const isSubmitted = meeting.report_submitted_at !== null

  // For submitted report: compute absence streaks
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
          attendanceStatus: rec
            ? (rec.status as MeetingAttendance['attendanceStatus'])
            : null,
        }
      })
      streakMap.set(personId, computeAbsenceStreak(meetingHistory))
    }
  }

  const statusLabel: Record<string, string> = {
    present: 'Presente',
    absent: 'Ausente',
    excused: 'Justificado',
    on_leave: 'Afastado',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reunioes" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Reunião</h1>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-2">
        <p className="font-medium">{formatScheduled(meeting.scheduled_at)}</p>
        {meeting.notes && (
          <p className="text-sm text-muted-foreground">{meeting.notes}</p>
        )}
        {isSubmitted && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Relatório enviado
          </span>
        )}
        {!isSubmitted && !withinDeadline && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Prazo encerrado
          </span>
        )}
      </div>

      {isSubmitted ? (
        // Read-only attendance view with streaks
        <div className="space-y-3">
          <h2 className="font-semibold">Frequência</h2>
          <div className="rounded-xl border bg-card divide-y">
            {members.map((m) => {
              const streak = streakMap.get(m.person_id) ?? 0
              const status = attendanceMap.get(m.person_id)
              return (
                <div key={m.person_id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    {streak >= 2 && (
                      <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                    )}
                    <span className="text-sm">{m.people?.full_name ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {status && (
                      <span className="text-xs text-muted-foreground">
                        {statusLabel[status] ?? status}
                      </span>
                    )}
                    {streak > 0 && (
                      <span className="text-xs font-medium text-amber-600">
                        {streak} falta{streak > 1 ? 's' : ''} seguida{streak > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Editable attendance form
        <AttendanceForm
          meetingId={meeting.id}
          members={members.map((m) => ({
            personId: m.person_id,
            fullName: m.people?.full_name ?? '—',
          }))}
          initialAttendance={Object.fromEntries(attendanceMap)}
          withinDeadline={withinDeadline}
        />
      )}
    </div>
  )
}
