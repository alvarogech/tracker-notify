import { computeAbsenceStreak, type MeetingAttendance } from '@/lib/business-rules/absences'
import { shouldCreateCase, shouldEscalate } from '@/lib/business-rules/pastoral-cases'
import { createAdminClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createAdminClient>

interface HistoryMeetingRow {
  id: string
  scheduled_at: string
  status: string
  report_submitted_at: string | null
  attendance_records: { person_id: string; status: string }[]
}

interface OpenCaseRow {
  id: string
  escalated_at: string | null
}

/**
 * Após o envio do relatório de uma reunião, recalcula a sequência de
 * ausências de cada pessoa marcada como ausente e cria/escala o caso de
 * pastoreio correspondente (5.1 e 5.7 do CLAUDE.md). Nunca resolve casos —
 * resolução exige ação humana explícita.
 */
export async function syncPastoralCasesAfterReport(
  admin: AdminClient,
  params: { meetingId: string; groupId: string; createdBy: string }
): Promise<void> {
  const { meetingId, groupId, createdBy } = params

  const { data: absentData } = await admin
    .from('attendance_records')
    .select('person_id')
    .eq('meeting_id', meetingId)
    .eq('status', 'absent')

  const absentPersonIds = ((absentData ?? []) as { person_id: string }[]).map((r) => r.person_id)
  if (absentPersonIds.length === 0) return

  const { data: historyData } = await admin
    .from('meetings')
    .select('id, scheduled_at, status, report_submitted_at, attendance_records(person_id, status)')
    .eq('group_id', groupId)
    .order('scheduled_at', { ascending: true })

  const history = (historyData ?? []) as unknown as HistoryMeetingRow[]

  for (const personId of absentPersonIds) {
    const meetingHistory: MeetingAttendance[] = history.map((h) => {
      const rec = h.attendance_records.find((ar) => ar.person_id === personId)
      return {
        scheduledAt: new Date(h.scheduled_at),
        meetingStatus: h.status === 'cancelled' ? 'cancelled' : 'completed',
        reportSubmittedAt: h.report_submitted_at ? new Date(h.report_submitted_at) : null,
        attendanceStatus: rec ? (rec.status as MeetingAttendance['attendanceStatus']) : null,
      }
    })
    const streak = computeAbsenceStreak(meetingHistory)

    const { data: openCaseData } = await admin
      .from('pastoral_cases')
      .select('id, escalated_at')
      .eq('person_id', personId)
      .eq('status', 'open')
      .maybeSingle()

    const openCase = openCaseData as OpenCaseRow | null
    const hasOpenCase = openCase !== null
    const alreadyEscalated = !!openCase?.escalated_at

    if (shouldCreateCase(streak, hasOpenCase)) {
      await admin.from('pastoral_cases').insert({
        person_id: personId,
        group_id: groupId,
        status: 'open',
        trigger_streak: streak,
        created_by: createdBy,
      } as never)
    } else if (shouldEscalate(streak, hasOpenCase, alreadyEscalated) && openCase) {
      await admin
        .from('pastoral_cases')
        .update({ escalated_at: new Date().toISOString() } as never)
        .eq('id', openCase.id)
    }
  }
}
