'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Users, HeartHandshake, LayoutDashboard, Building2, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_NAV_ITEMS, type NavItem, type NavIconName } from '@/lib/nav-items'

const ICON_MAP: Record<NavIconName, typeof Home> = {
  Home,
  CalendarDays,
  Users,
  HeartHandshake,
  LayoutDashboard,
  Building2,
  Inbox,
}

export function BottomNav({ items = DEFAULT_NAV_ITEMS }: { items?: NavItem[] }) {
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
