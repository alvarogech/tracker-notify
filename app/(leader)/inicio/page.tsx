import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { StatTile } from '@/components/dashboard/StatTile'
import { shouldSuggestConversion } from '@/lib/business-rules/visitors'
import { isReportWithinDeadline } from '@/lib/business-rules/absences'
import { isEligibleToServe, isEligibleToLeadFormatively } from '@/lib/business-rules/eligibility'
import { resolveActiveHost, resolveActiveCooperators } from '@/lib/business-rules/group-roles'
import {
  computeCoverageRate,
  computeAttendanceRate,
  formatRateFraction,
  formatRatePercent,
  selectRecentMeetings,
  type SimpleAttendanceStatus,
} from '@/lib/business-rules/indicators'
import {
  Users,
  Home,
  HandHeart,
  UserRoundPlus,
  CalendarCheck,
  HeartHandshake,
  GraduationCap,
  BadgeCheck,
  Award,
  Briefcase,
  Clock,
  ClipboardX,
  AlertTriangle,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Início' }

const RECENT_MEETINGS_WINDOW = 6
const ON_TIME_WINDOW_DAYS = 30

interface Group {
  id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
}

interface RelationshipRow {
  id: string
  person_id: string
  type: 'member' | 'visitor'
}

interface MeetingRow {
  id: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'cancelled'
  report_submitted_at: string | null
  attendance_records: { status: SimpleAttendanceStatus }[]
}

interface HostRow {
  ended_at: string | null
}

interface CooperatorRow {
  ended_at: string | null
}

interface DisciplershipRow {
  person_id: string
  ended_at: string | null
}

interface ServiceRow {
  person_id: string
  ended_at: string | null
}

interface TrainingRecordRow {
  person_id: string
  program: { code: string } | null
}

interface GroupIndicators {
  activeMembersCount: number
  hostDefined: boolean
  cooperatorsCount: number
  visitorsActiveCount: number
  attendanceRateLabel: string
  disciplershipLabel: string
  culturaLabel: string
  eligibleServeLabel: string
  eligibleLeadLabel: string
  serviceLabel: string
  onTimeLabel: string
}

export default async function InicioPage() {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()

  const { data: groupData } = await supabase
    .from('groups')
    .select('id, name, day_of_week, meeting_time, location')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .maybeSingle()

  const group = groupData as Group | null
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  let openCasesCount = 0
  let visitorsPendingConversionCount = 0
  let overdueMeetingsCount = 0
  let indicators: GroupIndicators | null = null

  if (group) {
    const [
      relationshipsRes,
      casesRes,
      meetingsRes,
      hostsRes,
      cooperatorsRes,
      disciplershipRes,
      serviceRes,
    ] = await Promise.all([
      supabase
        .from('group_relationships')
        .select('id, person_id, type')
        .eq('group_id', group.id)
        .eq('status', 'active'),
      supabase.from('pastoral_cases').select('id').eq('group_id', group.id).eq('status', 'open'),
      supabase
        .from('meetings')
        .select('id, scheduled_at, status, report_submitted_at, attendance_records(status)')
        .eq('group_id', group.id),
      supabase.from('group_hosts').select('ended_at').eq('group_id', group.id),
      supabase.from('group_cooperators').select('ended_at').eq('group_id', group.id),
      supabase.from('discipleship_assignments').select('person_id, ended_at').eq('group_id', group.id),
      supabase.from('service_assignments').select('person_id, ended_at').eq('group_id', group.id),
    ])

    const relationships = (relationshipsRes.data ?? []) as unknown as RelationshipRow[]
    const members = relationships.filter((r) => r.type === 'member')
    const visitors = relationships.filter((r) => r.type === 'visitor')
    const memberIds = members.map((m) => m.person_id)

    const visitorRelIds = visitors.map((v) => v.id)
    const visitCountByRelationship = new Map<string, number>()
    if (visitorRelIds.length > 0) {
      const { data: visitsData } = await supabase
        .from('visitor_visits')
        .select('group_relationship_id')
        .in('group_relationship_id', visitorRelIds)
      for (const v of (visitsData ?? []) as { group_relationship_id: string }[]) {
        visitCountByRelationship.set(
          v.group_relationship_id,
          (visitCountByRelationship.get(v.group_relationship_id) ?? 0) + 1
        )
      }
    }
    visitorsPendingConversionCount = visitors.filter((v) =>
      shouldSuggestConversion(visitCountByRelationship.get(v.id) ?? 0)
    ).length

    openCasesCount = (casesRes.data ?? []).length

    const meetings = (meetingsRes.data ?? []) as unknown as MeetingRow[]
    const now = new Date()
    overdueMeetingsCount = meetings.filter(
      (m) => m.status === 'scheduled' && !isReportWithinDeadline(new Date(m.scheduled_at), now)
    ).length

    const reportedMeetings = meetings.filter(
      (m) => m.status === 'completed' && m.report_submitted_at !== null
    )
    const recentMeetings = selectRecentMeetings(
      reportedMeetings.map((m) => ({ ...m, scheduledAt: new Date(m.scheduled_at) })),
      RECENT_MEETINGS_WINDOW
    )
    const attendanceStatuses = recentMeetings.flatMap((m) =>
      m.attendance_records.map((ar) => ar.status)
    )
    const attendanceRate = computeAttendanceRate(attendanceStatuses)

    const thirtyDaysAgo = new Date(now.getTime() - ON_TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const onTimeFlags = reportedMeetings
      .filter((m) => new Date(m.scheduled_at) >= thirtyDaysAgo)
      .map((m) => isReportWithinDeadline(new Date(m.scheduled_at), new Date(m.report_submitted_at!)))
    const onTimeRate = computeCoverageRate(onTimeFlags)

    const hosts = (hostsRes.data ?? []) as unknown as HostRow[]
    const activeHost = resolveActiveHost(
      hosts.map((h) => ({ endedAt: h.ended_at ? new Date(h.ended_at) : null }))
    )

    const cooperators = (cooperatorsRes.data ?? []) as unknown as CooperatorRow[]
    const activeCooperators = resolveActiveCooperators(
      cooperators.map((c) => ({ endedAt: c.ended_at ? new Date(c.ended_at) : null }))
    )

    const disciplershipRows = (disciplershipRes.data ?? []) as unknown as DisciplershipRow[]
    const activeDisciplerPersonIds = new Set(
      disciplershipRows.filter((a) => a.ended_at === null).map((a) => a.person_id)
    )
    const disciplershipCoverage = computeCoverageRate(
      memberIds.map((id) => activeDisciplerPersonIds.has(id))
    )

    const serviceRows = (serviceRes.data ?? []) as unknown as ServiceRow[]
    const activeServicePersonIds = new Set(
      serviceRows.filter((a) => a.ended_at === null).map((a) => a.person_id)
    )
    const serviceCoverage = computeCoverageRate(memberIds.map((id) => activeServicePersonIds.has(id)))

    const completedByPerson = new Map<string, string[]>()
    if (memberIds.length > 0) {
      const { data: recordsData } = await supabase
        .from('training_records')
        .select('person_id, program:training_programs(code)')
        .in('person_id', memberIds)
      for (const r of (recordsData ?? []) as unknown as TrainingRecordRow[]) {
        if (!r.program) continue
        const list = completedByPerson.get(r.person_id) ?? []
        list.push(r.program.code)
        completedByPerson.set(r.person_id, list)
      }
    }
    const culturaCoverage = computeCoverageRate(
      memberIds.map((id) => (completedByPerson.get(id) ?? []).includes('cultura_emaus'))
    )
    const eligibleServeCoverage = computeCoverageRate(
      memberIds.map((id) => isEligibleToServe(completedByPerson.get(id) ?? []))
    )
    const eligibleLeadCoverage = computeCoverageRate(
      memberIds.map((id) => isEligibleToLeadFormatively(completedByPerson.get(id) ?? []))
    )

    indicators = {
      activeMembersCount: members.length,
      hostDefined: activeHost !== null,
      cooperatorsCount: activeCooperators.length,
      visitorsActiveCount: visitors.length,
      attendanceRateLabel: formatRateFraction(attendanceRate),
      disciplershipLabel: formatRateFraction(disciplershipCoverage),
      culturaLabel: formatRateFraction(culturaCoverage),
      eligibleServeLabel: formatRateFraction(eligibleServeCoverage),
      eligibleLeadLabel: formatRateFraction(eligibleLeadCoverage),
      serviceLabel: formatRateFraction(serviceCoverage),
      onTimeLabel: formatRatePercent(onTimeRate),
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">Olá,</p>
        <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
      </div>

      {group ? (
        <>
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{group.name}</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                Seu GR
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {group.day_of_week !== null && (
                <p>
                  {days[group.day_of_week]} · {group.meeting_time?.slice(0, 5)}
                </p>
              )}
              {group.location && <p>{group.location}</p>}
            </div>
            <div className="pt-2 flex gap-3">
              <Link
                href="/pessoas"
                className="flex-1 text-center text-sm font-medium bg-primary text-primary-foreground rounded-lg py-2.5 hover:bg-primary/90 transition-colors"
              >
                Pessoas
              </Link>
              <Link
                href="/casos"
                className="flex-1 text-center text-sm font-medium border border-input rounded-lg py-2.5 hover:bg-accent transition-colors"
              >
                Casos
              </Link>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ações prioritárias
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/casos" className="block">
                <StatTile
                  label="Casos de pastoreio abertos"
                  value={openCasesCount}
                  icon={AlertTriangle}
                  variant={openCasesCount > 0 ? 'danger' : 'default'}
                />
              </Link>
              <Link href="/pessoas" className="block">
                <StatTile
                  label="Visitantes aguardando vinculação"
                  value={visitorsPendingConversionCount}
                  icon={UserRoundPlus}
                  variant={visitorsPendingConversionCount > 0 ? 'warning' : 'default'}
                />
              </Link>
              <Link href="/reunioes" className="block">
                <StatTile
                  label="Relatórios com prazo encerrado"
                  value={overdueMeetingsCount}
                  icon={ClipboardX}
                  variant={overdueMeetingsCount > 0 ? 'danger' : 'default'}
                />
              </Link>
            </div>
          </section>

          {indicators && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Indicadores do GR
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Membros ativos" value={indicators.activeMembersCount} icon={Users} />
                <StatTile
                  label="Anfitrião definido"
                  value={indicators.hostDefined ? 'Sim' : 'Não'}
                  icon={Home}
                  variant={indicators.hostDefined ? 'default' : 'warning'}
                />
                <StatTile label="Cooperadores ativos" value={indicators.cooperatorsCount} icon={HandHeart} />
                <StatTile label="Visitantes ativos" value={indicators.visitorsActiveCount} icon={UserRoundPlus} />
                <StatTile
                  label={`Taxa de presença (últimas ${RECENT_MEETINGS_WINDOW} reuniões)`}
                  value={indicators.attendanceRateLabel}
                  icon={CalendarCheck}
                />
                <StatTile
                  label="Membros com discipulador ativo"
                  value={indicators.disciplershipLabel}
                  icon={HeartHandshake}
                />
                <StatTile
                  label="Cultura Emaús concluída"
                  value={indicators.culturaLabel}
                  icon={GraduationCap}
                />
                <StatTile label="Aptos a servir" value={indicators.eligibleServeLabel} icon={BadgeCheck} />
                <StatTile
                  label="Atendem requisitos formativos p/ liderança"
                  value={indicators.eligibleLeadLabel}
                  icon={Award}
                />
                <StatTile
                  label="Com grupo de atuação ativo"
                  value={indicators.serviceLabel}
                  icon={Briefcase}
                />
                <StatTile
                  label={`Relatórios no prazo (${ON_TIME_WINDOW_DAYS} dias)`}
                  value={indicators.onTimeLabel}
                  icon={Clock}
                />
                <StatTile
                  label="Relatórios com prazo encerrado"
                  value={overdueMeetingsCount}
                  icon={ClipboardX}
                  variant={overdueMeetingsCount > 0 ? 'danger' : 'default'}
                />
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-card p-5 text-center text-muted-foreground text-sm">
          Nenhum GR vinculado a este líder.
        </div>
      )}
    </div>
  )
}
