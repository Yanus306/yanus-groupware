import { baseClient } from './baseClient'
import type { Team, User, UserRole, UserStatus } from '../../entities/user/model/types'

export interface ProfileUpdatePayload {
  name?: string
  password?: string
}

export interface UpdateMemberTeamPayload {
  teamId: number
}

// OpenAPI MemberResponse: id는 integer(int64) — User.id(string)로 변환 필요
interface MemberResponse {
  id: number
  name: string
  email: string
  role: string
  status: string
  team: string
}

function toUser(m: MemberResponse): User {
  return {
    id: String(m.id),
    name: m.name,
    email: m.email,
    role: m.role as User['role'],
    status: m.status as UserStatus,
    team: m.team as User['team'],
  }
}

export const getMembers = async (filters?: { teamName?: Team; role?: UserRole }): Promise<User[]> => {
  const params = new URLSearchParams()
  if (filters?.teamName) params.set('teamName', filters.teamName)
  if (filters?.role) params.set('role', filters.role)
  const query = params.toString()
  const list = await baseClient.get<MemberResponse[]>(`/api/v1/members${query ? `?${query}` : ''}`)
  return list.map(toUser)
}

export const getMember = async (id: string): Promise<User> => {
  const m = await baseClient.get<MemberResponse>(`/api/v1/members/${id}`)
  return toUser(m)
}

export const getMyProfile = async (): Promise<User> => {
  const m = await baseClient.get<MemberResponse>('/api/v1/members/me')
  return toUser(m)
}

export const updateMemberRole = (id: string, role: string) =>
  baseClient.patch<null>(`/api/v1/members/${id}/role`, { role })

export const updateMemberTeam = (id: string, payload: UpdateMemberTeamPayload) =>
  baseClient.patch<null>(`/api/v1/members/${id}/team`, payload)

export const deactivateMember = (id: string) =>
  baseClient.delete<null>(`/api/v1/members/${id}`)

export const activateMember = (id: string) =>
  baseClient.patch<null>(`/api/v1/members/${id}/activate`, {})

export const updateMyProfile = (payload: ProfileUpdatePayload) =>
  baseClient.put<null>('/api/v1/members/me', payload)
