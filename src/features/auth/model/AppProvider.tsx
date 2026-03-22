import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, PersonalWorkSchedule } from '../../../entities/user/model/types'

export type { UserRole, Team, User, PersonalWorkSchedule } from '../../../entities/user/model/types'

export interface AppState {
  currentUser: User | null
  users: User[]
}

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
  loadUser: (user: User) => void
  loadMembers: (users: User[]) => void
  logout: () => void
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
  })
  const [personalSchedule, setPersonalSchedule] = useState<PersonalWorkSchedule>(defaultSchedule)

  const isAdmin =
    state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'TEAM_LEAD'

  function loadUser(user: User) {
    setState((prev) => ({ ...prev, currentUser: user }))
  }

  function loadMembers(users: User[]) {
    setState((prev) => ({ ...prev, users }))
  }

  function logout() {
    localStorage.removeItem('accessToken')
    setState({ currentUser: null, users: [] })
  }

  return (
    <AppContext.Provider
      value={{ state, personalSchedule, setPersonalSchedule, isAdmin: !!isAdmin, loadUser, loadMembers, logout }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
