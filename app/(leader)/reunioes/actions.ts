'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { isReportWithinDeadline } from '@/lib/business-rules/absences'
import { syncPastoralCasesAfterReport } from '@/lib/pastoral-care/case-sync'

type ActionResult = { error: string } | undefined

async function getLeaderGroupId(leaderId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('groups')
    .select('id')
    .eq('leader_id', leaderId)
    .eq('active', true)
    .single()
  return (data as { id: string } | null)?.id ?? null
}

async function assertMeetingBelongsToLeader(
  meetingId: string,
  leaderId: string
): Promise<{ groupId: string; scheduledAt: string; reportSubmittedAt: string | null; status: string } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('meetings')
    .select('id, group_id, scheduled_at, report_submitted_at, status, groups!inner(leader_id)')
    .eq('id', meetingId)
    .single()

  if (!data) return null
  const row = data as unknown as {
    id: string
    group_id: string
    scheduled_at: string
    report_submitted_at: string | null
    status: string
    groups: { leader_id: string }
  }
  if (row.groups.leader_id !== leaderId) return null
  return {
    groupId: row.group_id,
    scheduledAt: row.scheduled_at,
    reportSubmittedAt: row.report_submitted_at,
    status: row.status,
  }
}

export async function createMeeting(
  groupId: string,
  scheduledAt: string,
  notes: string
): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const leaderGroupId = await getLeaderGroupId(profile.id)
  if (!leaderGroupId || leaderGroupId !== groupId) {
    return { error: 'GR não encontrado ou sem permissão.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('meetings').insert({
    group_id: groupId,
    scheduled_at: scheduledAt,
    notes: notes || null,
    status: 'scheduled',
  } as never)

  if (error) return { error: 'Erro ao criar reunião.' }
  revalidatePath('/reunioes')
}

export async function cancelMeeting(meetingId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const meeting = await assertMeetingBelongsToLeader(meetingId, profile.id)
  if (!meeting) return { error: 'Reunião não encontrada ou sem permissão.' }
  if (meeting.status !== 'scheduled') return { error: 'Apenas reuniões agendadas podem ser canceladas.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('meetings')
    .update({ status: 'cancelled' } as never)
    .eq('id', meetingId)

  if (error) return { error: 'Erro ao cancelar reunião.' }
  revalidatePath('/reunioes')
  revalidatePath(`/reunioes/${meetingId}`)
}

export async function saveDraftAttendance(
  meetingId: string,
  records: { personId: string; status: string }[]
): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const meeting = await assertMeetingBelongsToLeader(meetingId, profile.id)
  if (!meeting) return { error: 'Reunião não encontrada ou sem permissão.' }
  if (meeting.reportSubmittedAt) return { error: 'Relatório já enviado. Frequência bloqueada.' }
  if (meeting.status === 'cancelled') return { error: 'Reunião cancelada.' }

  if (records.length === 0) return { error: 'Nenhum registro de frequência fornecido.' }

  const admin = createAdminClient()
  const rows = records.map((r) => ({
    meeting_id: meetingId,
    person_id: r.personId,
    status: r.status,
  }))

  const { error } = await admin
    .from('attendance_records')
    .upsert(rows as never, { onConflict: 'meeting_id,person_id' })

  if (error) return { error: 'Erro ao salvar frequência.' }
  revalidatePath(`/reunioes/${meetingId}`)
}

export async function submitReport(meetingId: string): Promise<ActionResult> {
  const profile = await requireRole(['leader'])
  const meeting = await assertMeetingBelongsToLeader(meetingId, profile.id)
  if (!meeting) return { error: 'Reunião não encontrada ou sem permissão.' }
  if (meeting.reportSubmittedAt) return { error: 'Relatório já enviado.' }
  if (meeting.status === 'cancelled') return { error: 'Reunião cancelada.' }

  const scheduledAt = new Date(meeting.scheduledAt)
  if (!isReportWithinDeadline(scheduledAt, new Date())) {
    return { error: 'Prazo de 48 horas encerrado.' }
  }

  const admin = createAdminClient()

  // Verify at least 1 attendance record exists
  const { count } = await admin
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('meeting_id', meetingId)

  if (!count || count === 0) {
    return { error: 'Registre pelo menos uma presença antes de enviar o relatório.' }
  }

  const { error } = await admin
    .from('meetings')
    .update({
      status: 'completed',
      report_submitted_at: new Date().toISOString(),
    } as never)
    .eq('id', meetingId)

  if (error) return { error: 'Erro ao enviar relatório.' }

  await syncPastoralCasesAfterReport(admin, {
    meetingId,
    groupId: meeting.groupId,
    createdBy: profile.id,
  })

  revalidatePath('/reunioes')
  revalidatePath(`/reunioes/${meetingId}`)
  revalidatePath('/casos')
}
