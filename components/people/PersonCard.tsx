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
  visitCount?: number
  suggestConversion?: boolean
}

export function PersonCard({ person, type, visitCount, suggestConversion }: PersonCardProps) {
  return (
    <Link
      href={`/pessoas/${person.id}`}
      className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{person.full_name}</span>
        {person.phone && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone size={11} />
            {person.phone}
          </span>
        )}
      </div>
      {type === 'visitor' && (
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          {suggestConversion && (
            <Badge variant="info" className="text-xs">
              Sugerir vinculação
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            Visitante{typeof visitCount === 'number' ? ` · ${visitCount}` : ''}
          </Badge>
        </div>
      )}
    </Link>
  )
}
