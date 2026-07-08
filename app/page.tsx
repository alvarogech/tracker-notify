import Link from 'next/link'
import { HuiosLogo } from '@/components/brand/HuiosLogo'
import { EmausLogo } from '@/components/brand/EmausLogo'
import { InstitutionalFooter } from '@/components/brand/InstitutionalFooter'
import { Button } from '@/components/ui/button'

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
        </div>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-huios-cream/20 text-huios-cream/70 hover:bg-huios-cream/10 hover:text-huios-cream"
          >
            <Link href="/cadastro-lider">Sou líder de GR e quero me cadastrar</Link>
          </Button>
        </div>
      </main>

      <InstitutionalFooter variant="dark" />
    </div>
  )
}
