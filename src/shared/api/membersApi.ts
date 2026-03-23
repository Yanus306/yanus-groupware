import { baseClient } from './baseClient'
import type { User } from '../../entities/user/model/types'

export interface ProfileUpdatePayload {
  name?: string
  password?: string
}

export const getMembers = () => baseClient.get<User[]>('/api/v1/members')

export const getMember = (id: string) => baseClient.get<User>(`/api/v1/members/${id}`)

export const getMyProfile = () => baseClient.get<User>('/api/v1/members/me')

export const updateMemberRole = (id: string, role: string) =>
  baseClient.patch<null>(`/api/v1/members/${id}/role`, { role })

export const deactivateMember = (id: string) =>
  baseClient.delete<null>(`/api/v1/members/${id}`)

export const activateMember = (id: string) =>
  baseClient.patch<null>(`/api/v1/members/${id}/activate`, {})

export const updateMyProfile = (payload: ProfileUpdatePayload) =>
  baseClient.put<null>('/api/v1/members/me', payload)
