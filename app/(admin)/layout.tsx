import { AppBrandHeader } from '@/components/brand/AppBrandHeader'
import { BottomNav, type NavItem } from '@/components/layout/BottomNav'
import { requireRole } from '@/lib/auth/server'

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Painel', icon: 'LayoutDashboard' },
  { href: '/admin/solicitacoes', label: 'Solicitações', icon: 'Inbox' },
  { href: '/coordenacao', label: 'GRs', icon: 'Building2' },
  { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
  { href: '/casos', label: 'Casos', icon: 'HeartHandshake' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin'])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppBrandHeader showLogout settingsHref="/admin/configuracoes" />
      <main className="flex-1 px-4 py-6 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <BottomNav items={ADMIN_NAV_ITEMS} />
    </div>
  )
}
