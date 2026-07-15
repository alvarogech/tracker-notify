import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/recuperar-senha', '/cadastro-lider']
// Sempre acessíveis independente de sessão, sem redirecionar em nenhuma
// direção: /acesso-desativado (usuário logado precisa poder ficar lá) e /grs
// (página pública de divulgação, útil também para quem já está logado).
const ALWAYS_PUBLIC = ['/acesso-desativado', '/grs']

// supabase.auth.getUser() pode travar indefinidamente com cookie de sessão
// expirado/inválido (bug conhecido do supabase-js) — sem timeout, isso trava
// a Edge Function inteira até o limite da plataforma, derrubando toda rota
// que passa pelo middleware. Trata timeout igual a "sem sessão".
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // Rotas sempre acessíveis — não redirecionar independente de sessão
  if (ALWAYS_PUBLIC.some((r) => path.startsWith(r))) {
    return response
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
    if (!profile) return response

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

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|brand|manifest|api).*)'],
}
