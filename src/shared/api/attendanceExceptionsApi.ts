import { baseClient } from './baseClient'

export type AttendanceExceptionType =
  | 'MISSED_CHECK_IN'
  | 'MISSED_CHECK_OUT'
  | 'LATE'
  | 'NO_SCHEDULE'

export type AttendanceExceptionStatus =
  | 'OPEN'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESOLVED'

export interface AttendanceException {
  id: number
  memberId: number
  memberName: string
  teamName: string
  workDate: string
  type: AttendanceExceptionType
  status: AttendanceExceptionStatus
  note: string | null
  reason: string | null
  approvedBy: string | null
  approvedAt: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  attendanceRecordId: number | null
  scheduledStartTime: string | null
  scheduledEndTime: string | null
  checkInTime: string | null
  checkOutTime: string | null
}

export interface AttendanceExceptionSummary {
  totalCount: number
  filteredCount: number
  openCount: number
  missedCheckInCount: number
  missedCheckOutCount: number
  lateCount: number
  noScheduleCount: number
}

export interface AttendanceExceptionListResponse {
  date: string
  summary: AttendanceExceptionSummary
  items: AttendanceException[]
}

export interface AttendanceExceptionQuery {
  date: string
  type?: AttendanceExceptionType | 'ALL'
  status?: AttendanceExceptionStatus | 'ALL'
  teamName?: string
}

export interface AttendanceExceptionUpdatePayload {
  note?: string
  reason?: string
}

export interface AttendanceExceptionActionPayload {
  note?: string
}

export interface AttendanceExceptionBulkAutoCheckoutPayload {
  date: string
  memberIds?: number[]
}

export interface AttendanceExceptionBulkAutoCheckoutResult {
  processedCount: number
  updatedIds: number[]
}

export const getAttendanceExceptions = ({ date, type, status, teamName }: AttendanceExceptionQuery) => {
  const params = new URLSearchParams({ date })

  if (type && type !== 'ALL') {
    params.set('type', type)
  }

  if (status && status !== 'ALL') {
    params.set('status', status)
  }

  if (teamName) {
    params.set('teamName', teamName)
  }

  return baseClient.get<AttendanceExceptionListResponse>(`/api/v1/attendance-exceptions?${params.toString()}`)
}

export const updateAttendanceException = (exceptionId: number, body: AttendanceExceptionUpdatePayload) =>
  baseClient.patch<AttendanceException>(`/api/v1/attendance-exceptions/${exceptionId}`, body)

export const approveAttendanceException = (exceptionId: number, body: AttendanceExceptionActionPayload = {}) =>
  baseClient.post<AttendanceException>(`/api/v1/attendance-exceptions/${exceptionId}/approve`, body)

export const rejectAttendanceException = (exceptionId: number, body: AttendanceExceptionActionPayload = {}) =>
  baseClient.post<AttendanceException>(`/api/v1/attendance-exceptions/${exceptionId}/reject`, body)

export const resolveAttendanceException = (exceptionId: number, body: AttendanceExceptionActionPayload = {}) =>
  baseClient.post<AttendanceException>(`/api/v1/attendance-exceptions/${exceptionId}/resolve`, body)

export const bulkAutoCheckoutAttendanceExceptions = (body: AttendanceExceptionBulkAutoCheckoutPayload) =>
  baseClient.post<AttendanceExceptionBulkAutoCheckoutResult>('/api/v1/attendance-exceptions/bulk-auto-checkout', body)
