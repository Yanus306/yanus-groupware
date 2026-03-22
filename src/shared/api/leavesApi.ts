import { baseClient } from './baseClient'

export type LeaveCategory = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'OTHER'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Leave {
  id: number
  memberId: number
  memberName: string
  category: LeaveCategory
  detail: string
  date: string         // YYYY-MM-DD
  status: LeaveStatus
  submittedAt: string  // ISO datetime
  reviewedAt: string | null
}

export interface CreateLeavePayload {
  category: LeaveCategory
  detail: string
  date: string
}

export const getMyLeaves = () =>
  baseClient.get<Leave[]>('/api/v1/leaves')

export const createLeave = (body: CreateLeavePayload) =>
  baseClient.post<Leave>('/api/v1/leaves', body)

export const getAdminLeaves = (teamId: number) =>
  baseClient.get<Leave[]>(`/api/v1/leaves/admin?teamId=${teamId}`)

export const approveLeave = (id: number) =>
  baseClient.patch<Leave>(`/api/v1/leaves/${id}/approve`, {})

export const rejectLeave = (id: number) =>
  baseClient.patch<Leave>(`/api/v1/leaves/${id}/reject`, {})
