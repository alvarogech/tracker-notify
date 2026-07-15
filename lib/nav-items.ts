import type { UserRole } from '@/lib/auth/types'

export type NavIconName = 'Home' | 'CalendarDays' | 'Users' | 'HeartHandshake' | 'LayoutDashboard' | 'Building2' | 'Inbox'

export interface NavItem {
  href: string
  label: string
  icon: NavIconName
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: '/inicio', label: 'Início', icon: 'Home' },
  { href: '/reunioes', label: 'Reuniões', icon: 'CalendarDays' },
  { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
  { href: '/casos', label: 'Casos', icon: 'HeartHandshake' },
]

// Fonte única dos itens de navegação por papel — usada pelos três layouts
// ((admin), (coordination), (leader)) para que o rodapé nunca mude ao
// navegar entre seções que ficam em route groups diferentes (ex: admin
// clicando de /admin para /pessoas, que fisicamente mora em (leader)).
//
// Fica num módulo sem "use client" de propósito: os layouts são Server
// Components e chamam esta função diretamente no corpo — importar uma
// função assim de um arquivo "use client" (como BottomNav.tsx) quebra em
// build de produção (o bundler troca o export por uma referência de
// cliente, e a chamada direta vira "X is not a function" só em produção,
// nunca em `next dev` nem em `next build`/typecheck).
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
  return DEFAULT_NAV_ITEMS
}
