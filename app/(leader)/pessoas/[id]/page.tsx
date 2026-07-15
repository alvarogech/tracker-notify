import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/auth/types'
import { ArrowLeft } from 'lucide-react'
import { PersonInfoCard } from '@/components/people/PersonInfoCard'
import { countVisits, shouldSuggestConversion } from '@/lib/business-rules/visitors'
import { isEligibleToServe, isEligibleToLeadFormatively } from '@/lib/business-rules/eligibility'
import { VisitorPanel } from '@/components/people/VisitorPanel'
import { CaseStatusBadge } from '@/components/pastoral-care/CaseStatusBadge'
import { ManualCaseButton } from '@/components/pastoral-care/ManualCaseButton'
import { DisciplershipPanel } from '@/components/discipleship/DisciplershipPanel'
import { TrainingPanel } from '@/components/training/TrainingPanel'
import { ServiceAssignmentsPanel } from '@/components/service/ServiceAssignmentsPanel'
import { TransferPersonPanel } from '@/components/groups/TransferPersonPanel'
import { HostPanel } from '@/components/groups/HostPanel'
import { CooperatorsPanel } from '@/components/groups/CooperatorsPanel'
import { CooperatorAccessPanel } from '@/components/groups/CooperatorAccessPanel'

export const metadata: Metadata = { title: 'Perfil da pessoa' }

interface RelRow {
  id: string
  type: string
  status: string
  started_at: string
  group: { id: string; name: string } | null
  person: {
    id: string
    full_name: string
    phone?: string | null
    email?: string | null
    birthdate?: string | null
    archived_at?: string | null
  } | null
}

interface GroupOptionRow {
  id: string
  name: string
}

interface OpenCaseRow {
  id: string
  status: 'open' | 'resolved'
  escalated_at: string | null
}

interface AssignmentRow {
  id: string
  started_at: string
  ended_at: string | null
  discipler: { id: string; full_name: string } | null
}

interface DisciplerOptionRow {
  id: string
  fullName: string
}

function sortDisciplerOptions(rows: DisciplerOptionRow[], priorityIds: Set<string>): DisciplerOptionRow[] {
  const byName = (a: DisciplerOptionRow, b: DisciplerOptionRow) => a.fullName.localeCompare(b.fullName, 'pt-BR')
  const priority = rows.filter((r) => priorityIds.has(r.id)).sort(byName)
  const rest = rows.filter((r) => !priorityIds.has(r.id)).sort(byName)
  return [...priority, ...rest]
}

// Coordenação/admin veem a rede inteira (líderes/cooperadores ativos primeiro,
// depois o resto); líder comum vê só pessoas do próprio GR (líderes fora do
// próprio GR nunca aparecem — CLAUDE.md 7, líder não visualiza outros GRs).
async function getDisciplerOptions(
  supabase: ReturnType<typeof createClient>,
  profile: UserProfile,
  ownGroupId: string | null
): Promise<DisciplerOptionRow[]> {
  if (profile.role === 'coordinator' || profile.role === 'admin') {
    const [peopleRes, leaderRes, cooperatorRes] = await Promise.all([
      supabase.from('people').select('id, full_name').is('archived_at', null),
      supabase.from('profiles').select('person_id').eq('role', 'leader').eq('active', true).not('person_id', 'is', null),
      supabase.from('group_cooperators').select('person_id').is('ended_at', null),
    ])
    const priorityIds = new Set<string>([
      ...((leaderRes.data ?? []) as { person_id: string }[]).map((r) => r.person_id),
      ...((cooperatorRes.data ?? []) as { person_id: string }[]).map((r) => r.person_id),
    ])
    const rows = ((peopleRes.data ?? []) as { id: string; full_name: string }[]).map((p) => ({
      id: p.id,
      fullName: p.full_name,
    }))
    return sortDisciplerOptions(rows, priorityIds)
  }

  if (profile.role === 'leader' && ownGroupId) {
    const [relRes, cooperatorRes] = await Promise.all([
      supabase
        .from('group_relationships')
        .select('person_id, person:people(id, full_name)')
        .eq('group_id', ownGroupId)
        .eq('status', 'active'),
      supabase.from('group_cooperators').select('person_id').eq('group_id', ownGroupId).is('ended_at', null),
    ])
    const priorityIds = new Set(((cooperatorRes.data ?? []) as { person_id: string }[]).map((r) => r.person_id))
    const rows = (
      (relRes.data ?? []) as unknown as { person_id: string; person: { id: string; full_name: string } | null }[]
    )
      .filter((r) => r.person)
      .map((r) => ({ id: r.person!.id, fullName: r.person!.full_name }))
    return sortDisciplerOptions(rows, priorityIds)
  }

  return []
}

interface TrainingProgramRow {
  id: string
  code: string
  name: string
  display_order: number
}

interface TrainingRecordRow {
  program_id: string
  completed_at: string
}

interface MinistryAreaRow {
  id: string
  name: string
}

interface ServiceAssignmentRow {
  id: string
  started_at: string
  ended_at: string | null
  ministry_area: { id: string; name: string } | null
}

interface GroupHostRow {
  id: string
  person_id: string
  started_at: string
  ended_at: string | null
  host: { id: string; full_name: string } | null
}

interface GroupCooperatorRow {
  id: string
  started_at: string
  ended_at: string | null
}

export default async function PersonPage({ params }: { params: { id: string } }) {
  const profile = await requireRole(['leader', 'coordinator', 'admin', 'cooperator'])
  // Cooperador tem acesso puramente operacional (Reuniões e Pessoas) — sem
  // pastoreio, discipulado, formação, serviço ou papéis de anfitrião/
  // cooperador (CLAUDE.md 5.8). As seções abaixo ficam de fora tanto na
  // consulta (evita ida ao banco que o RLS ia zerar mesmo assim) quanto na
  // renderização.
  const isCooperator = profile.role === 'cooperator'
  const supabase = createClient()

  const { data } = await supabase
    .from('group_relationships')
    .select(
      'id, type, status, started_at, group:groups(id, name), person:people(id, full_name, phone, email, birthdate, archived_at)'
    )
    .eq('person_id', params.id)
    .eq('status', 'active')
    .single()

  const rel = data as unknown as RelRow | null
  if (!rel?.person) notFound()

  const person = rel.person

  const canTransfer = profile.role === 'coordinator' || profile.role === 'admin'
  const isMemberWithGroup = rel.type === 'member' && !!rel.group

  // Nenhuma destas consultas depende do resultado de outra — todas usam
  // apenas `person.id`/`rel.group.id`, já conhecidos após a consulta acima.
  // Buscadas em paralelo para evitar 6+ idas sequenciais ao banco por painel.
  const [
    visitsRes,
    openCaseRes,
    assignmentRes,
    disciplerOptions,
    programsRes,
    recordsRes,
    areasRes,
    serviceRes,
    hostRes,
    cooperatorRes,
    transferGroupsRes,
    helperRes,
  ] = await Promise.all([
    rel.type === 'visitor'
      ? supabase.from('visitor_visits').select('visited_at').eq('group_relationship_id', rel.id)
      : Promise.resolve({ data: [] as { visited_at: string }[] }),
    !isCooperator
      ? supabase
          .from('pastoral_cases')
          .select('id, status, escalated_at')
          .eq('person_id', person.id)
          .eq('status', 'open')
          .maybeSingle()
      : Promise.resolve({ data: null }),
    !isCooperator
      ? supabase
          .from('discipleship_assignments')
          .select('id, started_at, ended_at, discipler:people(id, full_name)')
          .eq('person_id', person.id)
          .order('started_at', { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    !isCooperator && rel.type === 'member'
      ? getDisciplerOptions(supabase, profile, isMemberWithGroup && rel.group ? rel.group.id : null)
      : Promise.resolve([] as DisciplerOptionRow[]),
    !isCooperator
      ? supabase.from('training_programs').select('id, code, name, display_order').order('display_order')
      : Promise.resolve({ data: [] as unknown[] }),
    !isCooperator
      ? supabase.from('training_records').select('program_id, completed_at').eq('person_id', person.id)
      : Promise.resolve({ data: [] as unknown[] }),
    !isCooperator
      ? supabase.from('ministry_areas').select('id, name').order('name')
      : Promise.resolve({ data: [] as unknown[] }),
    !isCooperator
      ? supabase
          .from('service_assignments')
          .select('id, started_at, ended_at, ministry_area:ministry_areas(id, name)')
          .eq('person_id', person.id)
          .order('started_at', { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    !isCooperator && isMemberWithGroup && rel.group
      ? supabase
          .from('group_hosts')
          .select('id, person_id, started_at, host:people(id, full_name)')
          .eq('group_id', rel.group.id)
          .is('ended_at', null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    !isCooperator && isMemberWithGroup && rel.group
      ? supabase
          .from('group_cooperators')
          .select('id, started_at, ended_at')
          .eq('person_id', person.id)
          .eq('group_id', rel.group.id)
          .is('ended_at', null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    canTransfer && rel.type === 'member'
      ? supabase.from('groups').select('id, name').eq('active', true).order('name')
      : Promise.resolve({ data: [] as GroupOptionRow[] }),
    !isCooperator
      ? supabase.from('group_helpers').select('created_at, profiles(active)').eq('person_id', person.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const visitCount = countVisits(
    (visitsRes.data as { visited_at: string }[]).map((v) => ({ visitedAt: new Date(v.visited_at) }))
  )

  const openCase = openCaseRes.data as OpenCaseRow | null

  const rawAssignments = (assignmentRes.data ?? []) as unknown as AssignmentRow[]
  const assignments = rawAssignments.map((a) => ({
    id: a.id,
    disciplerId: a.discipler?.id ?? null,
    disciplerName: a.discipler?.full_name ?? 'Discipulador removido',
    startedAt: a.started_at,
    endedAt: a.ended_at,
  }))
  const activeAssignment = assignments.find((a) => a.endedAt === null) ?? null
  const history = assignments.filter((a) => a.endedAt !== null)

  const filteredDisciplerOptions = disciplerOptions.filter((d) => d.id !== activeAssignment?.disciplerId)

  const trainingPrograms = (programsRes.data ?? []) as unknown as TrainingProgramRow[]
  const trainingRecords = (recordsRes.data ?? []) as unknown as TrainingRecordRow[]
  const completedAtByProgramId = new Map(trainingRecords.map((r) => [r.program_id, r.completed_at]))

  const programStatuses = trainingPrograms.map((program) => ({
    code: program.code,
    name: program.name,
    completedAt: completedAtByProgramId.get(program.id) ?? null,
  }))
  const completedProgramCodes = programStatuses
    .filter((p) => p.completedAt !== null)
    .map((p) => p.code)

  const eligibleToServe = isEligibleToServe(completedProgramCodes)
  const eligibleToLeadFormatively = isEligibleToLeadFormatively(completedProgramCodes)

  const ministryAreas = (areasRes.data ?? []) as unknown as MinistryAreaRow[]
  const rawServiceAssignments = (serviceRes.data ?? []) as unknown as ServiceAssignmentRow[]
  const serviceAssignments = rawServiceAssignments.map((a) => ({
    id: a.id,
    areaId: a.ministry_area?.id ?? null,
    areaName: a.ministry_area?.name ?? 'Área removida',
    startedAt: a.started_at,
    endedAt: a.ended_at,
  }))
  const activeServiceAssignments = serviceAssignments.filter((a) => a.endedAt === null)
  const serviceHistory = serviceAssignments.filter((a) => a.endedAt !== null)
  const activeServiceAreaIds = new Set(activeServiceAssignments.map((a) => a.areaId))
  const serviceAreaOptions = ministryAreas
    .filter((area) => !activeServiceAreaIds.has(area.id))
    .map((area) => ({ id: area.id, name: area.name }))

  let activeHost: { id: string; personId: string; personName: string; startedAt: string } | null = null
  let isCurrentHost = false
  let isActiveCooperatorRole = false
  let activeCooperatorAssignmentId: string | null = null
  let activeCooperatorStartedAt: string | null = null

  const hostRow = hostRes.data as unknown as GroupHostRow | null
  if (hostRow) {
    activeHost = {
      id: hostRow.id,
      personId: hostRow.person_id,
      personName: hostRow.host?.full_name ?? 'Pessoa removida',
      startedAt: hostRow.started_at,
    }
    isCurrentHost = hostRow.person_id === person.id
  }

  const cooperatorRow = cooperatorRes.data as unknown as GroupCooperatorRow | null
  if (cooperatorRow) {
    isActiveCooperatorRole = true
    activeCooperatorAssignmentId = cooperatorRow.id
    activeCooperatorStartedAt = cooperatorRow.started_at
  }

  const transferGroupOptions = ((transferGroupsRes.data ?? []) as unknown as GroupOptionRow[]).filter(
    (g) => g.id !== rel.group?.id
  )

  const helperRow = helperRes.data as unknown as { created_at: string; profiles: { active: boolean } | null } | null
  const cooperatorAccess = helperRow ? { active: helperRow.profiles?.active ?? false, createdAt: helperRow.created_at } : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/pessoas"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="truncate text-xl font-bold">{person.full_name}</h1>
      </div>

      <PersonInfoCard
        personId={person.id}
        fullName={person.full_name}
        phone={person.phone ?? null}
        email={person.email ?? null}
        birthdate={person.birthdate ?? null}
        startedAt={rel.started_at}
        type={rel.type === 'member' ? 'member' : 'visitor'}
        archived={!!person.archived_at}
        canEdit
      />

      {rel.type === 'visitor' && (
        <VisitorPanel
          relationshipId={rel.id}
          visitCount={visitCount}
          suggestConversion={shouldSuggestConversion(visitCount)}
        />
      )}

      {rel.type === 'member' && !isCooperator && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pastoreio
          </p>
          {openCase ? (
            <Link
              href={`/casos/${openCase.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
            >
              <span className="text-sm font-medium">Caso de pastoreio aberto</span>
              <CaseStatusBadge status={openCase.status} escalated={!!openCase.escalated_at} />
            </Link>
          ) : (
            profile.role === 'leader' && <ManualCaseButton personId={person.id} />
          )}
        </div>
      )}

      {rel.type === 'member' && !isCooperator && (
        <DisciplershipPanel
          personId={person.id}
          activeAssignment={activeAssignment}
          history={history}
          disciplerOptions={filteredDisciplerOptions}
        />
      )}

      {rel.type === 'member' && canTransfer && rel.group && (
        <TransferPersonPanel
          personId={person.id}
          currentGroupName={rel.group.name}
          groupOptions={transferGroupOptions}
          activeDisciplerName={activeAssignment?.disciplerName ?? null}
        />
      )}

      {rel.type === 'member' && !isCooperator && rel.group && (
        <HostPanel
          personId={person.id}
          groupId={rel.group.id}
          isCurrentHost={isCurrentHost}
          activeHostAssignmentId={isCurrentHost ? activeHost?.id ?? null : null}
          activeHostName={activeHost?.personName ?? null}
          activeHostStartedAt={activeHost?.startedAt ?? null}
        />
      )}

      {rel.type === 'member' && !isCooperator && rel.group && (
        <CooperatorsPanel
          personId={person.id}
          groupId={rel.group.id}
          isActiveCooperator={isActiveCooperatorRole}
          activeCooperatorAssignmentId={activeCooperatorAssignmentId}
          activeCooperatorStartedAt={activeCooperatorStartedAt}
        />
      )}

      {rel.type === 'member' && !isCooperator && rel.group && isActiveCooperatorRole && (
        <CooperatorAccessPanel
          personId={person.id}
          groupId={rel.group.id}
          email={person.email ?? null}
          access={cooperatorAccess}
        />
      )}

      {rel.type === 'member' && !isCooperator && (
        <TrainingPanel
          personId={person.id}
          programs={programStatuses}
          eligibleToServe={eligibleToServe}
          eligibleToLeadFormatively={eligibleToLeadFormatively}
        />
      )}

      {rel.type === 'member' && !isCooperator && (
        <ServiceAssignmentsPanel
          personId={person.id}
          eligibleToServe={eligibleToServe}
          activeAssignments={activeServiceAssignments}
          history={serviceHistory}
          areaOptions={serviceAreaOptions}
        />
      )}
    </div>
  )
}
