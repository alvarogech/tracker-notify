import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Phone, Mail, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { countVisits, shouldSuggestConversion } from '@/lib/business-rules/visitors'
import { isEligibleToServe, isEligibleToLeadFormatively } from '@/lib/business-rules/eligibility'
import { VisitorPanel } from '@/components/people/VisitorPanel'
import { CaseStatusBadge } from '@/components/pastoral-care/CaseStatusBadge'
import { ManualCaseButton } from '@/components/pastoral-care/ManualCaseButton'
import { DisciplershipPanel } from '@/components/discipleship/DisciplershipPanel'
import { TrainingPanel } from '@/components/training/TrainingPanel'
import { ServiceAssignmentsPanel } from '@/components/service/ServiceAssignmentsPanel'
import { TransferPersonPanel } from '@/components/groups/TransferPersonPanel'

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

export default async function PersonPage({ params }: { params: { id: string } }) {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
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

  let visitCount = 0
  if (rel.type === 'visitor') {
    const { data: visits } = await supabase
      .from('visitor_visits')
      .select('visited_at')
      .eq('group_relationship_id', rel.id)
    visitCount = countVisits(
      ((visits ?? []) as { visited_at: string }[]).map((v) => ({
        visitedAt: new Date(v.visited_at),
      }))
    )
  }

  const { data: openCaseData } = await supabase
    .from('pastoral_cases')
    .select('id, status, escalated_at')
    .eq('person_id', person.id)
    .eq('status', 'open')
    .maybeSingle()

  const openCase = openCaseData as OpenCaseRow | null

  const { data: assignmentData } = await supabase
    .from('discipleship_assignments')
    .select('id, started_at, ended_at, discipler:profiles(id, full_name)')
    .eq('person_id', person.id)
    .order('started_at', { ascending: false })

  const rawAssignments = (assignmentData ?? []) as unknown as AssignmentRow[]
  const assignments = rawAssignments.map((a) => ({
    id: a.id,
    disciplerId: a.discipler?.id ?? null,
    disciplerName: a.discipler?.full_name ?? 'Discipulador removido',
    startedAt: a.started_at,
    endedAt: a.ended_at,
  }))
  const activeAssignment = assignments.find((a) => a.endedAt === null) ?? null
  const history = assignments.filter((a) => a.endedAt !== null)

  const { data: disciplerData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('active', true)
    .in('role', ['leader', 'coordinator', 'admin'])
    .order('full_name')

  const disciplerOptions = ((disciplerData ?? []) as { id: string; full_name: string }[])
    .filter((d) => d.id !== activeAssignment?.disciplerId)
    .map((d) => ({ id: d.id, fullName: d.full_name }))

  const { data: programsData } = await supabase
    .from('training_programs')
    .select('id, code, name, display_order')
    .order('display_order')

  const { data: recordsData } = await supabase
    .from('training_records')
    .select('program_id, completed_at')
    .eq('person_id', person.id)

  const trainingPrograms = (programsData ?? []) as unknown as TrainingProgramRow[]
  const trainingRecords = (recordsData ?? []) as unknown as TrainingRecordRow[]
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

  const { data: areasData } = await supabase
    .from('ministry_areas')
    .select('id, name')
    .order('name')

  const { data: serviceData } = await supabase
    .from('service_assignments')
    .select('id, started_at, ended_at, ministry_area:ministry_areas(id, name)')
    .eq('person_id', person.id)
    .order('started_at', { ascending: false })

  const ministryAreas = (areasData ?? []) as unknown as MinistryAreaRow[]
  const rawServiceAssignments = (serviceData ?? []) as unknown as ServiceAssignmentRow[]
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

  const canTransfer = profile.role === 'coordinator' || profile.role === 'admin'
  let transferGroupOptions: { id: string; name: string }[] = []
  if (canTransfer && rel.type === 'member') {
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name')
      .eq('active', true)
      .order('name')
    transferGroupOptions = ((groupsData ?? []) as unknown as GroupOptionRow[]).filter(
      (g) => g.id !== rel.group?.id
    )
  }

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

      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <Badge variant={rel.type === 'member' ? 'default' : 'secondary'}>
            {rel.type === 'member' ? 'Membro' : 'Visitante'}
          </Badge>
          {person.archived_at && (
            <Badge variant="outline" className="text-muted-foreground">
              Arquivado
            </Badge>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {person.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={15} />
              <span>{person.phone}</span>
            </div>
          )}
          {person.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail size={15} />
              <span>{person.email}</span>
            </div>
          )}
          {person.birthdate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={15} />
              <span>{formatDate(person.birthdate)}</span>
            </div>
          )}
        </div>

        <div className="pt-1 text-xs text-muted-foreground/60">
          Vinculado em {formatDate(rel.started_at)}
        </div>
      </div>

      {rel.type === 'visitor' && (
        <VisitorPanel
          relationshipId={rel.id}
          visitCount={visitCount}
          suggestConversion={shouldSuggestConversion(visitCount)}
        />
      )}

      {rel.type === 'member' && (
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

      {rel.type === 'member' && (
        <DisciplershipPanel
          personId={person.id}
          activeAssignment={activeAssignment}
          history={history}
          disciplerOptions={disciplerOptions}
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

      {rel.type === 'member' && (
        <TrainingPanel
          personId={person.id}
          programs={programStatuses}
          eligibleToServe={eligibleToServe}
          eligibleToLeadFormatively={eligibleToLeadFormatively}
        />
      )}

      {rel.type === 'member' && (
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
