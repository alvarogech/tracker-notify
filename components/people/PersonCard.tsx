import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Person {
  id: string
  full_name: string
  phone?: string | null
  archived_at?: string | null
}

interface PersonCardProps {
  person: Person
  type: 'member' | 'visitor'
}

export function PersonCard({ person, type }: PersonCardProps) {
  return (
    <Link
      href={`/pessoas/${person.id}`}
      className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-accent transition-colors"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-medium text-sm truncate">{person.full_name}</span>
        {person.phone && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone size={11} />
            {person.phone}
          </span>
        )}
      </div>
      {type === 'visitor' && (
        <Badge variant="secondary" className="ml-3 shrink-0 text-xs">Visitante</Badge>
      )}
    </Link>
  )
}
