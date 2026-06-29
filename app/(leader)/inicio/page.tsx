import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Início' }

interface Group {
  id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
}

export default async function InicioPage() {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()

  const { data } = await supabase
    .from('groups')
    .select('id, name, day_of_week, meeting_time, location')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .single()

  const group = data as Group | null
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">Olá,</p>
        <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
      </div>

      {group ? (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{group.name}</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              Seu GR
            </span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {group.day_of_week !== null && (
              <p>{days[group.day_of_week]} · {group.meeting_time?.slice(0, 5)}</p>
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
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-5 text-center text-muted-foreground text-sm">
          Nenhum GR vinculado a este líder.
        </div>
      )}
    </div>
  )
}
