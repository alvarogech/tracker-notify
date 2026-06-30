export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'on_leave'

export type MeetingAttendance = {
  scheduledAt: Date
  meetingStatus: 'completed' | 'cancelled'
  reportSubmittedAt: Date | null
  attendanceStatus: AttendanceStatus | null
}

const REPORT_DEADLINE_HOURS = 48

export function computeAbsenceStreak(history: MeetingAttendance[]): number {
  const relevant = history
    .filter(
      (m) =>
        m.meetingStatus !== 'cancelled' &&
        m.reportSubmittedAt !== null
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())

  let streak = 0
  for (const m of relevant) {
    if (m.attendanceStatus === 'present' || m.attendanceStatus === 'excused') {
      streak = 0
    } else if (m.attendanceStatus === 'absent') {
      streak += 1
    } else if (m.attendanceStatus === 'on_leave') {
      // streak unchanged
    }
    // null = not recorded for this person → skip
  }
  return streak
}

export function needsPastoralCase(streak: number): boolean {
  return streak === 2
}

export function needsEscalation(streak: number): boolean {
  return streak === 4
}

export function isReportWithinDeadline(scheduledAt: Date, now: Date): boolean {
  const deadlineMs = REPORT_DEADLINE_HOURS * 60 * 60 * 1000
  return now.getTime() - scheduledAt.getTime() <= deadlineMs
}
