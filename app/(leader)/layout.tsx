import { AppBrandHeader } from '@/components/brand/AppBrandHeader'
import { BottomNav, type NavItem } from '@/components/layout/BottomNav'
import { requireRole } from '@/lib/auth/server'

// Cooperador tem acesso puramente operacional (Reuniões e Pessoas) — sem
// Início (indicadores incluem casos de pastoreio) nem Casos, conforme
// CLAUDE.md 5.8.
const COOPERATOR_NAV_ITEMS: NavItem[] = [
  { href: '/reunioes', label: 'Reuniões', icon: 'CalendarDays' },
  { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
]

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['leader', 'coordinator', 'admin', 'cooperator'])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppBrandHeader showLogout settingsHref="/configuracoes" />
      <main className="flex-1 px-4 py-6 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <BottomNav items={profile.role === 'cooperator' ? COOPERATOR_NAV_ITEMS : undefined} />
    </div>
  )
}
