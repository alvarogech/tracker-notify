import type { LucideIcon } from 'lucide-react'

const VARIANT_ICON_CLASS = {
  default: 'text-muted-foreground',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
} as const

interface StatTileProps {
  label: string
  value: string | number
  icon: LucideIcon
  variant?: keyof typeof VARIANT_ICON_CLASS
}

export function StatTile({ label, value, icon: Icon, variant = 'default' }: StatTileProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={VARIANT_ICON_CLASS[variant]} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
