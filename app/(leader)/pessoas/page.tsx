import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { PersonCard } from '@/components/people/PersonCard'
import { UserPlus } from 'lucide-react'

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

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
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
    .sort((a, b) =>
      (a.person?.full_name ?? '').localeCompare(b.person?.full_name ?? '', 'pt-BR')
    )

  const members = people.filter((r) => r.type === 'member')
  const visitors = people.filter((r) => r.type === 'visitor')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{group?.name ?? 'Pessoas'}</h1>
        <Link
          href="/pessoas/nova"
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={16} />
          Adicionar
        </Link>
      </div>

      <input
        type="search"
        defaultValue={q}
        placeholder="Buscar por nome ou telefone…"
        className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {members.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Membros · {members.length}
          </p>
          {members.map((r) => (
            <PersonCard key={r.id} person={r.person!} type="member" />
          ))}
        </section>
      )}

      {visitors.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Visitantes · {visitors.length}
          </p>
          {visitors.map((r) => (
            <PersonCard key={r.id} person={r.person!} type="visitor" />
          ))}
        </section>
      )}

      {people.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">
          {q ? 'Nenhum resultado encontrado.' : 'Nenhuma pessoa vinculada a este GR.'}
        </p>
      )}
    </div>
  )
}
