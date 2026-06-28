import { cn } from '@/lib/utils'

interface EmausLogoProps {
  /** 'default' = escuro sobre claro | 'light' = creme para fundo escuro */
  variant?: 'default' | 'light'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  xs: 'text-base',
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
}

const variantMap = {
  default: 'text-foreground',
  light: 'text-huios-cream',
}

/**
 * Wordmark Igreja Emaús.
 * Marca institucional secundária — usada com menor destaque que a HUIOS.
 * Usa tipografia condensada para fidelidade ao estilo da marca Emaús.
 *
 * Arquivo vetorial oficial pendente — ver docs/BRAND_GUIDELINES.md.
 */
export function EmausLogo({ variant = 'default', size = 'md', className }: EmausLogoProps) {
  return (
    <span
      className={cn(
        'font-brand font-black tracking-widest leading-none select-none uppercase',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      role="img"
      aria-label="Igreja Emaús"
      style={{ letterSpacing: '0.12em', fontStretch: 'condensed' }}
    >
      EMAÚS
    </span>
  )
}
