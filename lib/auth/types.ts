export type UserRole = 'leader' | 'coordinator' | 'admin' | 'cooperator'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  active: boolean
  pending_approval: boolean
}
