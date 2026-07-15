import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { getCallerGroupId } from '@/lib/auth/group-scope'
import { createAdminClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { NovaReuniaoForm } from './NovaReuniaoForm'

export const metadata: Metadata = { title: 'Nova Reunião' }

export default async function NovaReuniaoPage() {
  const profile = await requireRole(['leader', 'cooperator'])
  const admin = createAdminClient()
  const groupId = await getCallerGroupId(profile)

  const { data } = groupId
    ? await admin.from('groups').select('id, name').eq('id', groupId).single()
    : { data: null }

  const group = data as { id: string; name: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/reunioes"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Nova Reunião</h1>
      </div>

      {group ? (
        <NovaReuniaoForm groupId={group.id} groupName={group.name} />
      ) : (
        <div className="rounded-xl border bg-card p-5 text-center text-muted-foreground text-sm">
          Nenhum GR vinculado a este líder.
        </div>
      )}
    </div>
  )
}
