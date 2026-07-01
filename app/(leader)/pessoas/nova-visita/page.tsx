import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/server'
import { RegisterVisitorForm } from '@/components/people/RegisterVisitorForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Registrar visitante' }

export default async function NovaVisitaPage() {
  await requireRole(['leader'])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/pessoas"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Registrar visitante</h1>
      </div>
      <RegisterVisitorForm />
    </div>
  )
}
