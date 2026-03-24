export type UserRole = 'MEMBER' | 'ADMIN' | 'TEAM_LEAD'
export type Team = string
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  team: Team
  role: UserRole
  status?: UserStatus
  online?: boolean
}
