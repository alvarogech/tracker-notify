import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { redirectAfterLogin } from '@/lib/auth/server'
import type { UserRole } from '@/lib/auth/types'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(result.error.errors[0].message)}`, request.url),
      { status: 303 }
    )
  }

  // Coleta os cookies que o Supabase quer setar durante a autenticação
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

  const { error } = await supabase.auth.signInWithPassword(result.data)
  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=E-mail+ou+senha+incorretos.', request.url),
      { status: 303 }
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=Erro+ao+autenticar.', request.url),
      { status: 303 }
    )
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as { role: UserRole; active: boolean } | null

  let dest = !typedProfile?.active
    ? '/acesso-desativado'
    : redirectAfterLogin(typedProfile.role)

  if (process.env.DEBUG_LOGIN) {
    const debugPayload = JSON.stringify({ userId: user.id, profile, profileError: profileError?.message ?? null })
    dest = `${dest}?debug=${encodeURIComponent(debugPayload)}`
  }

  // Cria a resposta final e aplica todos os cookies coletados
  const response = NextResponse.redirect(new URL(dest, request.url), { status: 303 })
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  return response
}
