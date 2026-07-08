export type UserRole = 'leader' | 'coordinator' | 'admin'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  active: boolean
  pending_approval: boolean
}
