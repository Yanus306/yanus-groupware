import type { User } from '../../entities/user/model/types'
import type { TeamResponse } from '../api/teamsApi'

const TEAM_CACHE_KEY = 'yanus.team-options'
export const DEFAULT_SIGNUP_TEAM_NAME = '신입'

export const FALLBACK_TEAMS: TeamResponse[] = [
  { id: 1, name: '1팀' },
  { id: 2, name: '2팀' },
  { id: 3, name: '3팀' },
  { id: 4, name: '4팀' },
  { id: 5, name: DEFAULT_SIGNUP_TEAM_NAME },
]

export function formatTeamName(team?: string | null) {
  const trimmed = team?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : '미지정 팀'
}

export function sortTeams<T extends { name: string }>(teams: T[]) {
  return [...teams].sort((left, right) => left.name.localeCompare(right.name, 'ko-KR', { numeric: true }))
}

export function getDefaultSignupTeam(teams: TeamResponse[]) {
  return teams.find((team) => team.name === DEFAULT_SIGNUP_TEAM_NAME) ?? null
}

export function cacheTeams(teams: TeamResponse[]) {
  try {
    localStorage.setItem(TEAM_CACHE_KEY, JSON.stringify(sortTeams(teams)))
  } catch {
    // Ignore cache write failures.
  }
}

export function getCachedTeams() {
  try {
    const raw = localStorage.getItem(TEAM_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TeamResponse[]
    if (!Array.isArray(parsed)) return []
    return sortTeams(
      parsed.filter(
        (team): team is TeamResponse =>
          Boolean(team) &&
          typeof team.id === 'number' &&
          typeof team.name === 'string' &&
          team.name.trim().length > 0,
      ),
    )
  } catch {
    return []
  }
}

function compareTeamName(left?: string | null, right?: string | null) {
  return formatTeamName(left).localeCompare(formatTeamName(right), 'ko-KR', { numeric: true })
}

export function sortUsersByTeamAndName<T extends User>(users: T[]) {
  return [...users].sort((left, right) => {
    const leftInactive = (left.status ?? 'ACTIVE') === 'INACTIVE'
    const rightInactive = (right.status ?? 'ACTIVE') === 'INACTIVE'

    if (leftInactive !== rightInactive) {
      return leftInactive ? 1 : -1
    }

    const teamCompare = compareTeamName(left.team, right.team)
    if (teamCompare !== 0) {
      return teamCompare
    }

    return left.name.localeCompare(right.name, 'ko-KR', { numeric: true })
  })
}

export function getTeamOptions(users: User[], teams: TeamResponse[]) {
  if (teams.length > 0) {
    return sortTeams(teams)
  }

  const uniqueTeams = Array.from(
    new Set(users.map((user) => user.team).filter((team): team is string => Boolean(team))),
  )

  return sortTeams(
    uniqueTeams.map((team, index) => ({
      id: index + 1,
      name: team,
    })),
  )
}
