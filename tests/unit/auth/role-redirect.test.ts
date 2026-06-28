import { describe, it, expect } from 'vitest'
import { redirectAfterLogin } from '@/lib/auth/server'

describe('redirectAfterLogin', () => {
  it('leader → /inicio', () => {
    expect(redirectAfterLogin('leader')).toBe('/inicio')
  })

  it('coordinator → /coordenacao', () => {
    expect(redirectAfterLogin('coordinator')).toBe('/coordenacao')
  })

  it('admin → /admin', () => {
    expect(redirectAfterLogin('admin')).toBe('/admin')
  })
})
