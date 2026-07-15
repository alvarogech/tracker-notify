import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { HuiosLogo } from '@/components/brand/HuiosLogo'
import { InstitutionalFooter } from '@/components/brand/InstitutionalFooter'
import { PublicGroupSignupForm } from '@/components/public/PublicGroupSignupForm'

export const metadata: Metadata = { title: 'Cadastro' }
export const dynamic = 'force-dynamic'

interface GroupRow {
  id: string
  name: string
  active: boolean
}

interface PersonRow {
  id: string
  full_name: string
  archived_at: string | null
}

interface RelRow {
  person: PersonRow | null
}

export default async function GroupSignupPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: groupData } = await admin.from('groups').select('id, name, active').eq('id', params.id).single()
  const group = groupData as GroupRow | null
  if (!group || !group.active) notFound()

  const { data: relData } = await admin
    .from('group_relationships')
    .select('person:people(id, full_name, archived_at)')
    .eq('group_id', group.id)
    .eq('type', 'member')
    .eq('status', 'active')

  const people = ((relData ?? []) as unknown as RelRow[])
    .filter((r) => r.person && !r.person.archived_at)
    .map((r) => ({ id: r.person!.id, full_name: r.person!.full_name }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))

  return (
    <div className="flex min-h-screen flex-col bg-huios-dark">
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="flex items-center gap-3">
            <Link href="/grs" className="text-huios-cream/60 transition-colors hover:text-huios-cream">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex flex-1 justify-center">
              <HuiosLogo variant="light" size="md" />
            </div>
            <div className="w-5" />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold text-huios-cream">{group.name}</h1>
            <p className="mt-1 text-sm text-huios-cream/60">Complete ou confirme seus dados de contato.</p>
          </div>

          <PublicGroupSignupForm groupId={group.id} people={people} />
        </div>
      </main>

      <InstitutionalFooter variant="dark" />
    </div>
  )
}
