import { baseClient } from './baseClient'
import type { User } from '../../entities/user/model/types'

export interface ProfileUpdatePayload {
  name?: string
  password?: string
}

export const getMembers = () => baseClient.get<User[]>('/api/v1/members')

export const getMyProfile = () => baseClient.get<User>('/api/v1/members/me')

export const updateMemberRole = (id: string, role: string) =>
  baseClient.patch<null>(`/api/v1/members/${id}/role`, { role })

export const updateMyProfile = (payload: ProfileUpdatePayload) =>
  baseClient.put<null>('/api/v1/members/me', payload)
