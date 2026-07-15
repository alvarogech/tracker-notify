import type { Metadata } from 'next'
import { Clock, MapPin } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { HuiosLogo } from '@/components/brand/HuiosLogo'
import { InstitutionalFooter } from '@/components/brand/InstitutionalFooter'

export const metadata: Metadata = {
  title: 'Onde encontrar um GR',
  description: 'Dias, horários e locais dos Grupos de Relacionamento da rede HUIOS.',
}

// Página pública (sem login) — sempre busca dados frescos do banco, nunca
// cacheada estaticamente, para refletir qualquer alteração feita pelos
// líderes/coordenação assim que salva.
export const dynamic = 'force-dynamic'

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

interface GroupRow {
  id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
  leader: { full_name: string } | null
}

export default async function PublicGroupsPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('groups')
    .select('id, name, day_of_week, meeting_time, location, leader:profiles(full_name)')
    .eq('active', true)
    .order('day_of_week')
    .order('meeting_time')

  const groups = (data ?? []) as unknown as GroupRow[]

  return (
    <div className="flex min-h-screen flex-col bg-huios-dark">
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-lg space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <HuiosLogo variant="light" size="lg" />
            <div>
              <h1 className="text-xl font-bold text-huios-cream">Onde encontrar um GR</h1>
              <p className="mt-1 text-sm text-huios-cream/60">
                Dia, horário e local de cada Grupo de Relacionamento da rede HUIOS. Chegue um pouco antes e pergunte
                pelo líder.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.id} className="rounded-xl border border-huios-cream/10 bg-huios-cream/5 p-4">
                <p className="font-semibold text-huios-cream">{g.name}</p>
                {g.leader && <p className="text-sm text-huios-cream/70">Líder: {g.leader.full_name}</p>}
                <div className="mt-2 space-y-1 text-sm text-huios-cream/60">
                  {g.day_of_week !== null && g.meeting_time && (
                    <p className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {DAYS[g.day_of_week]} · {g.meeting_time.slice(0, 5)}
                    </p>
                  )}
                  {g.location && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {g.location}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {groups.length === 0 && (
              <p className="py-12 text-center text-sm text-huios-cream/50">
                Nenhum GR ativo no momento — volte em breve.
              </p>
            )}
          </div>
        </div>
      </main>

      <InstitutionalFooter variant="dark" />
    </div>
  )
}
