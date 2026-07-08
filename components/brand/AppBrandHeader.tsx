import { HuiosLogo, HuiosAppIcon } from './HuiosLogo'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { cn } from '@/lib/utils'

interface AppBrandHeaderProps {
  groupName?: string
  className?: string
  /** Compact = apenas ícone + nome do GR (mobile). Full = wordmark completo. */
  compact?: boolean
  showLogout?: boolean
}

/**
 * Cabeçalho de marca para as telas do líder e coordenação.
 * Mobile-first: usa ícone compacto em viewports pequenos.
 */
export function AppBrandHeader({ groupName, className, compact = false, showLogout = false }: AppBrandHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center gap-3 border-b border-huios-cream/10 bg-huios-dark px-4',
        className
      )}
    >
      {compact ? (
        <HuiosAppIcon size={32} />
      ) : (
        <HuiosLogo variant="light" size="sm" />
      )}

      {groupName && (
        <>
          <span className="text-huios-cream/30 text-sm">·</span>
          <span className="text-huios-cream/80 text-sm font-medium truncate">{groupName}</span>
        </>
      )}

      {showLogout && (
        <div className="ml-auto">
          <LogoutButton />
        </div>
      )}
    </header>
  )
}
