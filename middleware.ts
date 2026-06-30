import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/recuperar-senha']
// /acesso-desativado é separado: usuário logado pode ficar lá sem ser redirecionado
const ALWAYS_PUBLIC = ['/acesso-desativado']

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
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase indisponível — tratar como não autenticado
  }

  const isPublic = PUBLIC_ROUTES.some((r) => path.startsWith(r))

  // Rota pública + usuário logado → redireciona para a área correta
  if (isPublic && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

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
