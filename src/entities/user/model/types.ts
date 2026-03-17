export type UserRole = 'member' | 'team_lead' | 'leader'
export type Team = 'design' | 'dev' | 'marketing' | 'product'

export interface User {
  id: string
  name: string
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
