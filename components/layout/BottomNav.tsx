'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Users, HeartHandshake, LayoutDashboard, Building2, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/auth/types'

const ICON_MAP = {
  Home,
  CalendarDays,
  Users,
  HeartHandshake,
  LayoutDashboard,
  Building2,
  Inbox,
}

export type NavIconName = keyof typeof ICON_MAP

export interface NavItem {
  href: string
  label: string
  icon: NavIconName
}

const DEFAULT_ITEMS: NavItem[] = [
  { href: '/inicio', label: 'Início', icon: 'Home' },
  { href: '/reunioes', label: 'Reuniões', icon: 'CalendarDays' },
  { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
  { href: '/casos', label: 'Casos', icon: 'HeartHandshake' },
]

// Fonte única dos itens de navegação por papel — usada pelos três layouts
// ((admin), (coordination), (leader)) para que o rodapé nunca mude ao
// navegar entre seções que ficam em route groups diferentes (ex: admin
// clicando de /admin para /pessoas, que fisicamente mora em (leader)).
export function getNavItemsForRole(role: UserRole): NavItem[] {
  if (role === 'admin') {
    return [
      { href: '/admin', label: 'Painel', icon: 'LayoutDashboard' },
      { href: '/admin/solicitacoes', label: 'Solicitações', icon: 'Inbox' },
      { href: '/coordenacao', label: 'GRs', icon: 'Building2' },
      { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
      { href: '/casos', label: 'Casos', icon: 'HeartHandshake' },
    ]
  }
  if (role === 'coordinator') {
    return [
      { href: '/coordenacao', label: 'GRs', icon: 'Building2' },
      { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
      { href: '/casos', label: 'Casos', icon: 'HeartHandshake' },
    ]
  }
  if (role === 'cooperator') {
    return [
      { href: '/reunioes', label: 'Reuniões', icon: 'CalendarDays' },
      { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
    ]
  }
  return DEFAULT_ITEMS
}

export function BottomNav({ items = DEFAULT_ITEMS }: { items?: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map(({ href, label, icon }) => {
          const Icon = ICON_MAP[icon]
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="w-full break-words text-center leading-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
