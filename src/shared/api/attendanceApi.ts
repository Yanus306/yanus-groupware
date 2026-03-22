import { baseClient } from './baseClient'

export interface AttendanceRecord {
  id: number
  memberId: number
  memberName: string
  workDate: string
  checkInTime: string
  checkOutTime: string | null
  status: 'WORKING' | 'LEFT'
}

export const getMyAttendance = () =>
  baseClient.get<AttendanceRecord[]>('/api/v1/attendances/me')

export const getAttendanceByDate = (date: string) =>
  baseClient.get<AttendanceRecord[]>(`/api/v1/attendances?date=${date}`)

export const clockIn = () =>
  baseClient.post<AttendanceRecord>('/api/v1/attendances/check-in', {})

export const clockOut = () =>
  baseClient.post<AttendanceRecord>('/api/v1/attendances/check-out', {})
