import { baseClient } from './baseClient'
import type { User } from '../../entities/user/model/types'

export const getMembers = () => baseClient.get<User[]>('/members')

export const updateMemberRole = (id: string, role: string) =>
  baseClient.patch<Pick<User, 'id' | 'role'>>(`/members/${id}/role`, { role })

export const inviteMember = (email: string, role: string) =>
  baseClient.post<{ id: string; email: string; role: string }>('/members/invite', { email, role })
