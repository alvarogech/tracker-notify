import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { PersonCard } from '@/components/people/PersonCard'
import { UserPlus, UserRoundPlus } from 'lucide-react'
import { countVisits, shouldSuggestConversion } from '@/lib/business-rules/visitors'

export const metadata: Metadata = { title: 'Pessoas' }

interface PersonRow {
  id: string
  full_name: string
  phone?: string | null
  archived_at?: string | null
}

interface RelationshipRow {
  id: string
  type: 'member' | 'visitor'
  status: string
  person: PersonRow | null
}

export default async function PessoasPage({ searchParams }: { searchParams: { q?: string } }) {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()
  const q = searchParams.q?.trim() ?? ''

  const { data: groupData } = await supabase
    .from('groups')
    .select('id, name')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .single()

  const group = groupData as { id: string; name: string } | null

  let query = supabase
    .from('group_relationships')
    .select('id, type, status, person:people(id, full_name, phone, archived_at)')
    .eq('status', 'active')

  if (group) query = query.eq('group_id', group.id)

  const { data } = await query
  const relationships = (data ?? []) as unknown as RelationshipRow[]

  const people = relationships
    .filter((r) => {
      if (!r.person || r.person.archived_at) return false
      if (!q) return true
      return (
        r.person.full_name.toLowerCase().includes(q.toLowerCase()) ||
        (r.person.phone ?? '').includes(q)
      )
    })
    .sort((a, b) => (a.person?.full_name ?? '').localeCompare(b.person?.full_name ?? '', 'pt-BR'))

  const members = people.filter((r) => r.type === 'member')
  const visitors = people.filter((r) => r.type === 'visitor')

  const visitorIds = visitors.map((r) => r.id)
  const visitCounts = new Map<string, number>()
  if (visitorIds.length > 0) {
    const { data: visitsData } = await supabase
      .from('visitor_visits')
      .select('group_relationship_id, visited_at')
      .in('group_relationship_id', visitorIds)

    const visits = (visitsData ?? []) as { group_relationship_id: string; visited_at: string }[]
    for (const relationshipId of visitorIds) {
      const relevant = visits
        .filter((v) => v.group_relationship_id === relationshipId)
        .map((v) => ({ visitedAt: new Date(v.visited_at) }))
      visitCounts.set(relationshipId, countVisits(relevant))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{group?.name ?? 'Pessoas'}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/pessoas/nova-visita"
            className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <UserRoundPlus size={16} />
            Visitante
          </Link>
          <Link
            href="/pessoas/nova"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <UserPlus size={16} />
            Adicionar
          </Link>
        </div>
      </div>

      <input
        type="search"
        defaultValue={q}
        placeholder="Buscar por nome ou telefone…"
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {members.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Membros · {members.length}
          </p>
          {members.map((r) => (
            <PersonCard key={r.id} person={r.person!} type="member" />
          ))}
        </section>
      )}

      {visitors.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Visitantes · {visitors.length}
          </p>
          {visitors.map((r) => {
            const visitCount = visitCounts.get(r.id) ?? 0
            return (
              <PersonCard
                key={r.id}
                person={r.person!}
                type="visitor"
                visitCount={visitCount}
                suggestConversion={shouldSuggestConversion(visitCount)}
              />
            )
          })}
        </section>
      )}

      {people.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {q ? 'Nenhum resultado encontrado.' : 'Nenhuma pessoa vinculada a este GR.'}
        </p>
      )}
    </div>
  )
}
