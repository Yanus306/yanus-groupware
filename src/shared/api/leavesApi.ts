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

// 승인/반려 모두 LeaveResponse 전체 반환 (OpenAPI 스펙 기준)
export const approveLeave = (id: number) =>
  baseClient.patch<Leave>(`/api/v1/leaves/${id}/approve`, {})

export const rejectLeave = (id: number) =>
  baseClient.patch<Leave>(`/api/v1/leaves/${id}/reject`, {})
