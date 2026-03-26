import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../../entities/user/model/types'
import { getMe } from '../api/authClient'
import { clearAuthTokens, getAccessToken } from '../../../shared/lib/authStorage'
import { getMembers } from '../../../shared/api/membersApi'
import { getTeams } from '../../../shared/api/teamsApi'
import type { TeamResponse } from '../../../shared/api/teamsApi'
import { FALLBACK_TEAMS, cacheTeams, getCachedTeams, sortTeams, sortUsersByTeamAndName } from '../../../shared/lib/team'
import { canAccessAdmin, canAccessTeamManagement } from '../../../shared/lib/permissions'

export type { UserRole, Team, User, UserStatus } from '../../../entities/user/model/types'

export interface AppState {
  currentUser: User | null
  users: User[]
  teams: TeamResponse[]
}

const AppContext = createContext<{
  state: AppState
  isAdmin: boolean
  isTeamLead: boolean
  isInitializing: boolean
  isBootstrapping: boolean
  loadUser: (user: User) => void
  loadMembers: (users: User[]) => void
  loadTeams: (teams: TeamResponse[]) => void
  refreshCurrentUser: () => Promise<User | null>
  refreshMembers: () => Promise<User[]>
  refreshTeams: () => Promise<TeamResponse[]>
  setBootstrapping: (value: boolean) => void
  logout: () => void
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    teams: FALLBACK_TEAMS,
  })
  const [isInitializing, setIsInitializing] = useState(true)
  const [isBootstrapping, setIsBootstrapping] = useState(false)

  const loadUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, currentUser: user }))
  }, [])

  const loadMembers = useCallback((users: User[]) => {
    setState((prev) => ({ ...prev, users: sortUsersByTeamAndName(users) }))
  }, [])

  const loadTeams = useCallback((teams: TeamResponse[]) => {
    cacheTeams(teams)
    setState((prev) => ({ ...prev, teams: sortTeams(teams) }))
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await getMe()
      setState((prev) => ({ ...prev, currentUser: user }))
      return user
    } catch {
      clearAuthTokens()
      setState((prev) => ({ ...prev, currentUser: null }))
      return null
    }
  }, [])

  const refreshMembers = useCallback(async () => {
    const members = await getMembers()
    const sortedMembers = sortUsersByTeamAndName(members)
    setState((prev) => ({ ...prev, users: sortedMembers }))
    return sortedMembers
  }, [])

  const refreshTeams = useCallback(async () => {
    const teams = await getTeams().catch(() => {
      const cachedTeams = getCachedTeams()
      return cachedTeams.length > 0 ? cachedTeams : FALLBACK_TEAMS
    })
    const sortedTeams = sortTeams(teams)
    cacheTeams(sortedTeams)
    setState((prev) => ({ ...prev, teams: sortedTeams }))
    return sortedTeams
  }, [])

  // 앱 시작 시 저장된 토큰으로 currentUser 복원
  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setIsInitializing(false)
      return
    }
    refreshCurrentUser()
      .finally(() => setIsInitializing(false))
  }, [refreshCurrentUser])

  const isAdmin = canAccessAdmin(state.currentUser)
  const isTeamLead = canAccessTeamManagement(state.currentUser)

  const logout = useCallback(() => {
    clearAuthTokens()
    setState({ currentUser: null, users: [], teams: FALLBACK_TEAMS })
    setIsBootstrapping(false)
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        isAdmin: !!isAdmin,
        isTeamLead: !!isTeamLead,
        isInitializing,
        isBootstrapping,
        loadUser,
        loadMembers,
        loadTeams,
        refreshCurrentUser,
        refreshMembers,
        refreshTeams,
        setBootstrapping: setIsBootstrapping,
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
