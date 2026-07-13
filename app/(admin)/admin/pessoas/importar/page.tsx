import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { ImportPeopleForm } from '@/components/admin/ImportPeopleForm'

export const metadata: Metadata = { title: 'Importar pessoas' }

interface GroupRow {
  id: string
  name: string
  location: string | null
}

export default async function ImportarPessoasPage() {
  await requireRole(['admin'])
  const supabase = createClient()

  const { data } = await supabase
    .from('groups')
    .select('id, name, location')
    .eq('active', true)
    .order('name')

  const groups = (data ?? []) as unknown as GroupRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Importar pessoas em massa</h1>
        <p className="text-sm text-muted-foreground">
          Cole os nomes copiados da sua planilha (um por linha) para cadastrar várias pessoas de uma vez em um GR. O
          restante dos dados cada líder completa depois.
        </p>
      </div>

      <ImportPeopleForm groups={groups} />
    </div>
  )
}
