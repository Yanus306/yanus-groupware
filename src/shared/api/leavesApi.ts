import { baseClient } from './baseClient'
import type { Leave, LeaveCategory } from '../../entities/leave/model/types'

export type { LeaveCategory, LeaveStatus, Leave } from '../../entities/leave/model/types'

export interface CreateLeavePayload {
  category: LeaveCategory
  detail: string
  date: string  // YYYY-MM-DD
}

export const getMyLeaves = () =>
  baseClient.get<Leave[]>('/api/v1/leaves')

export const createLeave = (body: CreateLeavePayload) =>
  baseClient.post<Leave>('/api/v1/leaves', body)

export const getAdminLeaves = (teamId: number) =>
  baseClient.get<Leave[]>(`/api/v1/leaves/admin?teamId=${teamId}`)

export const approveLeave = (id: number) =>
  baseClient.patch<Pick<Leave, 'id' | 'status' | 'reviewedAt'>>(`/api/v1/leaves/${id}/approve`, {})

export const rejectLeave = (id: number) =>
  baseClient.patch<Pick<Leave, 'id' | 'status' | 'reviewedAt'>>(`/api/v1/leaves/${id}/reject`, {})
