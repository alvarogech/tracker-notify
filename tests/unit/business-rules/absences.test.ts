import { describe, it, expect } from 'vitest'
import {
  computeAbsenceStreak,
  needsPastoralCase,
  needsEscalation,
  isReportWithinDeadline,
  type MeetingAttendance,
} from '@/lib/business-rules/absences'

function makeMeeting(
  daysAgo: number,
  attendanceStatus: MeetingAttendance['attendanceStatus'],
  opts: {
    meetingStatus?: MeetingAttendance['meetingStatus']
    submitted?: boolean
  } = {}
): MeetingAttendance {
  const scheduledAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return {
    scheduledAt,
    meetingStatus: opts.meetingStatus ?? 'completed',
    reportSubmittedAt: opts.submitted === false ? null : scheduledAt,
    attendanceStatus,
  }
}

describe('computeAbsenceStreak', () => {
  it('empty history → 0', () => {
    expect(computeAbsenceStreak([])).toBe(0)
  })

  it('all present → 0', () => {
    const history = [
      makeMeeting(7, 'present'),
      makeMeeting(14, 'present'),
      makeMeeting(21, 'present'),
    ]
    expect(computeAbsenceStreak(history)).toBe(0)
  })

  it('1 absent → streak 1', () => {
    const history = [makeMeeting(7, 'absent')]
    expect(computeAbsenceStreak(history)).toBe(1)
  })

  it('2 consecutive absent → streak 2, needsPastoralCase true', () => {
    const history = [makeMeeting(14, 'absent'), makeMeeting(7, 'absent')]
    const streak = computeAbsenceStreak(history)
    expect(streak).toBe(2)
    expect(needsPastoralCase(streak)).toBe(true)
    expect(needsEscalation(streak)).toBe(false)
  })

  it('4 consecutive absent → streak 4, needsEscalation true', () => {
    const history = [
      makeMeeting(28, 'absent'),
      makeMeeting(21, 'absent'),
      makeMeeting(14, 'absent'),
      makeMeeting(7, 'absent'),
    ]
    const streak = computeAbsenceStreak(history)
    expect(streak).toBe(4)
    expect(needsEscalation(streak)).toBe(true)
    expect(needsPastoralCase(streak)).toBe(false)
  })

  it('present after absents resets streak to 0', () => {
    const history = [
      makeMeeting(21, 'absent'),
      makeMeeting(14, 'absent'),
      makeMeeting(7, 'present'),
    ]
    expect(computeAbsenceStreak(history)).toBe(0)
  })

  it('excused resets streak to 0', () => {
    const history = [
      makeMeeting(21, 'absent'),
      makeMeeting(14, 'absent'),
      makeMeeting(7, 'excused'),
    ]
    expect(computeAbsenceStreak(history)).toBe(0)
  })

  it('cancelled meeting is ignored and does not affect streak', () => {
    const history = [
      makeMeeting(21, 'absent'),
      makeMeeting(14, null, { meetingStatus: 'cancelled' }),
      makeMeeting(7, 'absent'),
    ]
    expect(computeAbsenceStreak(history)).toBe(2)
  })

  it('meeting without submitted report is ignored', () => {
    const history = [
      makeMeeting(21, 'absent'),
      makeMeeting(14, 'absent', { submitted: false }),
      makeMeeting(7, 'absent'),
    ]
    expect(computeAbsenceStreak(history)).toBe(2)
  })

  it('on_leave mid-streak does not break or reset streak', () => {
    // 2 absent, on_leave, 1 absent → streak = 3
    const history = [
      makeMeeting(28, 'absent'),
      makeMeeting(21, 'absent'),
      makeMeeting(14, 'on_leave'),
      makeMeeting(7, 'absent'),
    ]
    expect(computeAbsenceStreak(history)).toBe(3)
  })

  it('streak resets then rebuilds: present after 2 absent, then 1 absent → streak 1', () => {
    const history = [
      makeMeeting(28, 'absent'),
      makeMeeting(21, 'absent'),
      makeMeeting(14, 'present'),
      makeMeeting(7, 'absent'),
    ]
    expect(computeAbsenceStreak(history)).toBe(1)
  })
})

describe('isReportWithinDeadline', () => {
  it('returns true when within 48 hours', () => {
    const scheduledAt = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
    expect(isReportWithinDeadline(scheduledAt, new Date())).toBe(true)
  })

  it('returns false when past 48 hours', () => {
    const scheduledAt = new Date(Date.now() - 49 * 60 * 60 * 1000) // 49h ago
    expect(isReportWithinDeadline(scheduledAt, new Date())).toBe(false)
  })
})
