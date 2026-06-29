import { MapPin, Clock } from 'lucide-react'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Group {
  id: string
  name: string
  location?: string | null
  day_of_week?: number | null
  meeting_time?: string | null
  active: boolean
  leader?: { full_name: string } | null
}

interface GroupCardProps {
  group: Group
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{group.name}</span>
        {!group.active && (
          <span className="text-xs text-muted-foreground">Inativo</span>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {group.leader && <p className="font-medium text-foreground/80">{group.leader.full_name}</p>}
        {group.day_of_week !== null && group.day_of_week !== undefined && (
          <p className="flex items-center gap-1">
            <Clock size={11} />
            {DAYS[group.day_of_week]} · {group.meeting_time?.slice(0, 5)}
          </p>
        )}
        {group.location && (
          <p className="flex items-center gap-1">
            <MapPin size={11} />
            {group.location}
          </p>
        )}
      </div>
    </div>
  )
}
