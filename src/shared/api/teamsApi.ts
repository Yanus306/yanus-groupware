import { baseClient } from './baseClient'

export interface TeamResponse {
  id: number
  name: string
}

export const getTeams = () => baseClient.get<TeamResponse[]>('/api/v1/teams')

export const getTeam = (id: number) => baseClient.get<TeamResponse>(`/api/v1/teams/${id}`)

export const createTeam = (name: string) =>
  baseClient.post<TeamResponse>('/api/v1/teams', { name })

export const deleteTeam = (teamId: number) =>
  baseClient.delete<null>(`/api/v1/teams/${teamId}`)
