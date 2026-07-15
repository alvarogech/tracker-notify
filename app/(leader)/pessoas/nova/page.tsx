import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/server'
import { AddPersonForm } from '@/components/people/AddPersonForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Adicionar pessoa' }

export default async function NovaPessoaPage() {
  await requireRole(['leader', 'coordinator', 'admin', 'cooperator'])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pessoas" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Adicionar pessoa</h1>
      </div>
      <AddPersonForm />
    </div>
  )
}
