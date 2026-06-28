import { cn } from '@/lib/utils'

interface HuiosLogoProps {
  /** 'default' = verde HUIOS | 'light' = creme | 'dark' = verde escuro */
  variant?: 'default' | 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  layout?: 'horizontal' | 'stacked'
  className?: string
}

const sizeMap = {
  xs: 'text-xl',
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-7xl',
  xl: 'text-8xl',
}

const variantMap = {
  default: 'text-huios-green',
  light: 'text-huios-cream',
  dark: 'text-huios-dark',
}

/**
 * Wordmark HUIOS.
 * Usa a fonte Outfit (carregada via next/font/google no layout raiz).
 * O "i" é propositalmente minúsculo — característica da identidade da marca.
 */
export function HuiosLogo({
  variant = 'default',
  size = 'md',
  layout = 'horizontal',
  className,
}: HuiosLogoProps) {
  if (layout === 'stacked') {
    return (
      <div
        className={cn(
          'font-brand font-black leading-none select-none',
          sizeMap[size],
          variantMap[variant],
          className
        )}
        role="img"
        aria-label="HUIOS"
      >
        <div>HU</div>
        <div
          className={cn(
            'border-t-2 border-current pt-1',
            size === 'xs' && 'text-lg',
            size === 'sm' && 'text-2xl',
            size === 'md' && 'text-4xl',
            size === 'lg' && 'text-6xl',
            size === 'xl' && 'text-7xl'
          )}
        >
          <span className="lowercase">i</span>OS
        </div>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'font-brand font-black tracking-tight leading-none select-none',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      role="img"
      aria-label="HUIOS"
    >
      HU<span className="lowercase">i</span>OS
    </span>
  )
}

/**
 * Ícone/marca compacta da HUIOS: "Hi" em quadrado arredondado.
 * Versão vetorial SVG inline — escala sem perda de qualidade.
 */
export function HuiosAppIcon({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="HUIOS"
      className={className}
    >
      {/* Fundo creme */}
      <rect width="100" height="100" rx="22" fill="#EDE8D8" />

      {/* Letra H */}
      <rect x="10" y="12" width="14" height="76" rx="2" fill="#0D2825" />
      <rect x="42" y="12" width="14" height="76" rx="2" fill="#0D2825" />
      <rect x="10" y="46" width="46" height="13" rx="2" fill="#0D2825" />

      {/* Letra i (minúscula) */}
      <circle cx="72" cy="20" r="7" fill="#0D2825" />
      <rect x="66" y="33" width="13" height="55" rx="6.5" fill="#0D2825" />
    </svg>
  )
}
