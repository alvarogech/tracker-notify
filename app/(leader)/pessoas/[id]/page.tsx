import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Phone, Mail, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Perfil da pessoa' }

interface RelRow {
  type: string
  status: string
  started_at: string
  person: {
    id: string
    full_name: string
    phone?: string | null
    email?: string | null
    birthdate?: string | null
    archived_at?: string | null
  } | null
}

export default async function PersonPage({ params }: { params: { id: string } }) {
  await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()

  const { data } = await supabase
    .from('group_relationships')
    .select('type, status, started_at, person:people(id, full_name, phone, email, birthdate, archived_at)')
    .eq('person_id', params.id)
    .eq('status', 'active')
    .single()

  const rel = data as unknown as RelRow | null
  if (!rel?.person) notFound()

  const person = rel.person

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pessoas" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold truncate">{person.full_name}</h1>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={rel.type === 'member' ? 'default' : 'secondary'}>
            {rel.type === 'member' ? 'Membro' : 'Visitante'}
          </Badge>
          {person.archived_at && (
            <Badge variant="outline" className="text-muted-foreground">Arquivado</Badge>
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

        <div className="text-xs text-muted-foreground/60 pt-1">
          Vinculado em {formatDate(rel.started_at)}
        </div>
      </div>
    </div>
  )
}
