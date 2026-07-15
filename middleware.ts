import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withTimeout } from '@/lib/timeout'

const PUBLIC_ROUTES = ['/login', '/recuperar-senha', '/cadastro-lider']
// Sempre acessíveis independente de sessão, sem redirecionar em nenhuma
// direção: /acesso-desativado (usuário logado precisa poder ficar lá) e /grs
// (página pública de divulgação, útil também para quem já está logado).
const ALWAYS_PUBLIC = ['/acesso-desativado', '/grs']

// Header que repassa para o Server Component o id do usuário já resolvido
// aqui — evita uma segunda chamada a supabase.auth.getUser() em
// getCurrentProfile() (lib/auth/server.ts), que dobra a latência de toda
// página protegida quando o Supabase Auth está lento. String vazia = "sem
// sessão" (distingue de header ausente, quando o middleware nem rodou).
const USER_ID_HEADER = 'x-huios-user-id'

export async function middleware(request: NextRequest) {
  const pendingCookies: { name: string; value: string; options?: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  function passThrough(userId: string | null): NextResponse {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(USER_ID_HEADER, userId ?? '')
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    )
    return res
  }

  // Rotas sempre acessíveis — não redirecionar independente de sessão
  if (ALWAYS_PUBLIC.some((r) => path.startsWith(r))) {
    return passThrough(null)
  }

  let user = null
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), 5000)
    user = data.user
  } catch {
    // Supabase indisponível ou getUser() travado — tratar como não autenticado
  }

  // path === '/' usa comparação exata (não startsWith) porque toda rota
  // começa com "/" — um startsWith aqui tornaria tudo "público".
  const isPublic = path === '/' || PUBLIC_ROUTES.some((r) => path.startsWith(r))

  // Rota pública + usuário logado → redireciona para a área correta
  if (isPublic && user) {
    let profile: { role: string; active: boolean } | null = null
    try {
      const { data } = await withTimeout(
        supabase.from('profiles').select('role, active').eq('id', user.id).single(),
        5000
      )
      profile = data
    } catch {
      // Timeout ou erro — deixa passar para o Server Component tratar
    }

    // Se não conseguiu ler o perfil, deixa passar para o Server Component tratar
    if (!profile) return passThrough(user.id)

    if (!profile.active) {
      return NextResponse.redirect(new URL('/acesso-desativado', request.url))
    }

    const dest =
      profile.role === 'admin' ? '/admin' :
      profile.role === 'coordinator' ? '/coordenacao' :
      '/inicio'

    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Rota protegida + sem sessão → login
  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return passThrough(user?.id ?? null)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|brand|manifest|api).*)'],
}
