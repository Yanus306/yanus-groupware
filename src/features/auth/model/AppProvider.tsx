import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../../entities/user/model/types'
import { getMe } from '../api/authClient'

export type { UserRole, Team, User, UserStatus } from '../../../entities/user/model/types'

export interface AppState {
  currentUser: User | null
  users: User[]
}

const AppContext = createContext<{
  state: AppState
  isAdmin: boolean
  isTeamLead: boolean
  isInitializing: boolean
  loadUser: (user: User) => void
  loadMembers: (users: User[]) => void
  logout: () => void
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
  })
  const [isInitializing, setIsInitializing] = useState(true)

  // 앱 시작 시 저장된 토큰으로 currentUser 복원
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsInitializing(false)
      return
    }
    getMe()
      .then((user) => setState((prev) => ({ ...prev, currentUser: user })))
      .catch(() => {
        // 토큰 만료 또는 유효하지 않음 — 자동 로그아웃
        localStorage.removeItem('accessToken')
      })
      .finally(() => setIsInitializing(false))
  }, [])

  const isAdmin = state.currentUser?.role === 'ADMIN'
  const isTeamLead = state.currentUser?.role === 'TEAM_LEAD'

  const loadUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, currentUser: user }))
  }, [])

  const loadMembers = useCallback((users: User[]) => {
    setState((prev) => ({ ...prev, users }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    setState({ currentUser: null, users: [] })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        isAdmin: !!isAdmin,
        isTeamLead: !!isTeamLead,
        isInitializing,
        loadUser,
        loadMembers,
        logout,
      }}
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
