export type UserRole = 'MEMBER' | 'ADMIN' | 'TEAM_LEAD'
export type Team = 'BACKEND' | 'FRONTEND' | 'AI' | 'SECURITY'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  team: Team
  role: UserRole
  online?: boolean
}

export interface PersonalWorkSchedule {
  workDays: boolean[] // Mon-Sun
  checkInTime: string
  checkOutTime: string
}
