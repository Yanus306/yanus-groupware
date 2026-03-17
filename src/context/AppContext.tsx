import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

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

export interface AppState {
  currentUser: User
  users: User[]
}

const mockUsers: User[] = [
  { id: '1', name: 'Alex Johnson', team: 'design', role: 'leader', online: true },
  { id: '2', name: 'Maria Garcia', team: 'design', role: 'member', online: true },
  { id: '3', name: 'David Chen', team: 'dev', role: 'team_lead', online: false },
  { id: '4', name: 'Sarah Lee', team: 'marketing', role: 'member', online: false },
  { id: '5', name: 'Mike Davis', team: 'product', role: 'member', online: true },
]

const defaultSchedule: PersonalWorkSchedule = {
  workDays: [true, true, true, true, true, false, false],
  checkInTime: '09:00',
  checkOutTime: '18:00',
}

const AppContext = createContext<{
  state: AppState
  personalSchedule: PersonalWorkSchedule
  setPersonalSchedule: (s: PersonalWorkSchedule) => void
  isAdmin: boolean
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state] = useState<AppState>({
    currentUser: mockUsers[0],
    users: mockUsers,
  })
  const [personalSchedule, setPersonalSchedule] = useState<PersonalWorkSchedule>(defaultSchedule)
  const isAdmin = state.currentUser.role === 'leader' || state.currentUser.role === 'team_lead'

  return (
    <AppContext.Provider value={{ state, personalSchedule, setPersonalSchedule, isAdmin }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
