import { baseClient } from './baseClient'
import type { User, UserStatus } from '../../entities/user/model/types'

export interface ProfileUpdatePayload {
  name?: string
  password?: string
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

export const getMembers = async (): Promise<User[]> => {
  const list = await baseClient.get<MemberResponse[]>('/api/v1/members')
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

export const deactivateMember = (id: string) =>
  baseClient.delete<null>(`/api/v1/members/${id}`)

export const activateMember = (id: string) =>
  baseClient.patch<null>(`/api/v1/members/${id}/activate`, {})

export const updateMyProfile = (payload: ProfileUpdatePayload) =>
  baseClient.put<null>('/api/v1/members/me', payload)
