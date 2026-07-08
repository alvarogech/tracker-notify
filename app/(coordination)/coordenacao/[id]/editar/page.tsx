import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/server'
import { EditGroupForm } from '@/components/groups/EditGroupForm'

export const metadata: Metadata = { title: 'Editar GR' }

interface GroupRow {
  id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
  active: boolean
}

export default async function EditarGrupoPage({ params }: { params: { id: string } }) {
  await requireRole(['admin'])
  const admin = createAdminClient()

  const { data } = await admin
    .from('groups')
    .select('id, name, day_of_week, meeting_time, location, active')
    .eq('id', params.id)
    .single()

  const group = data as GroupRow | null
  if (!group) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/coordenacao" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Editar GR</h1>
      </div>
      <EditGroupForm group={group} />
    </div>
  )
}
