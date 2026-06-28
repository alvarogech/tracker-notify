import { HuiosLogo } from '@/components/brand/HuiosLogo'
import { EmausLogo } from '@/components/brand/EmausLogo'
import { InstitutionalFooter } from '@/components/brand/InstitutionalFooter'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-huios-dark">
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        {/* Logo principal */}
        <div className="flex flex-col items-center gap-3">
          <HuiosLogo variant="light" size="xl" />
          <p className="text-huios-cream/60 text-base font-medium tracking-wide uppercase text-sm">
            Pastoreio
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-huios-cream/20" />

        {/* Marca institucional Emaús */}
        <div className="flex flex-col items-center gap-2">
          <EmausLogo variant="light" size="sm" />
          <p className="text-huios-cream/40 text-xs tracking-widest uppercase">
            Uma rede da Igreja Emaús
          </p>
        </div>

        {/* Status de desenvolvimento */}
        <div className="mt-8 rounded-lg border border-huios-cream/10 bg-huios-cream/5 px-6 py-4 text-center max-w-sm">
          <p className="text-huios-cream/70 text-sm">
            Sistema em desenvolvimento.
          </p>
          <p className="text-huios-cream/40 text-xs mt-1">
            Fase 0 — Fundação concluída
          </p>
        </div>
      </main>

      <InstitutionalFooter variant="dark" />
    </div>
  )
}
