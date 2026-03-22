import { baseClient } from './baseClient'
import type { Team } from '../../entities/user/model/types'

export interface TeamResponse {
  id: number
  name: Team
}

export const getTeams = () => baseClient.get<TeamResponse[]>('/api/v1/teams')

export const getTeam = (id: number) => baseClient.get<TeamResponse>(`/api/v1/teams/${id}`)
