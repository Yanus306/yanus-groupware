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

export const getMyAttendance = (date?: string) => {
  const url = date ? `/api/v1/attendances/me?date=${date}` : '/api/v1/attendances/me'
  return baseClient.get<AttendanceRecord[]>(url)
}

export const getAttendanceByDate = (date: string) =>
  baseClient.get<AttendanceRecord[]>(`/api/v1/attendances?date=${date}`)

export const clockIn = () =>
  baseClient.post<AttendanceRecord>('/api/v1/attendances/check-in', {})

export const clockOut = () =>
  baseClient.post<AttendanceRecord>('/api/v1/attendances/check-out', {})

export interface WorkSchedule {
  id: number
  memberId: number
  workStartTime: string   // HH:mm:ss
  workEndTime: string     // HH:mm:ss
  breakStartTime: string  // HH:mm:ss
  breakEndTime: string    // HH:mm:ss
}

export type WorkSchedulePayload = Pick<WorkSchedule, 'workStartTime' | 'workEndTime' | 'breakStartTime' | 'breakEndTime'>

export const getMyWorkSchedule = () =>
  baseClient.get<WorkSchedule>('/api/v1/work-schedules/me')

export const updateWorkSchedule = (body: Partial<WorkSchedulePayload>) =>
  baseClient.put<WorkSchedule>('/api/v1/work-schedules', body)
