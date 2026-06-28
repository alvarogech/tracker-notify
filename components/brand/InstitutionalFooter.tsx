import { EmausLogo } from './EmausLogo'
import { cn } from '@/lib/utils'

interface InstitutionalFooterProps {
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Rodapé institucional com presença da marca Emaús.
 * Usado em telas de login, configurações e páginas públicas.
 */
export function InstitutionalFooter({
  variant = 'light',
  className,
}: InstitutionalFooterProps) {
  const isDark = variant === 'dark'

  return (
    <footer
      className={cn(
        'py-6 px-4 text-center',
        isDark ? 'border-t border-huios-cream/10' : 'border-t border-border',
        className
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-brand font-black text-sm tracking-tight',
              isDark ? 'text-huios-cream/60' : 'text-muted-foreground'
            )}
          >
            Pastoreio HUIOS
          </span>
          <span className={isDark ? 'text-huios-cream/30' : 'text-muted-foreground/50'}>·</span>
          <EmausLogo
            variant={isDark ? 'light' : 'default'}
            size="xs"
            className={isDark ? 'opacity-60' : 'opacity-50'}
          />
        </div>
        <p
          className={cn(
            'text-xs',
            isDark ? 'text-huios-cream/30' : 'text-muted-foreground/60'
          )}
        >
          Uma rede da Igreja Emaús · Uso interno
        </p>
      </div>
    </footer>
  )
}
