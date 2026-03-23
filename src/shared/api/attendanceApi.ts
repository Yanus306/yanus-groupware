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

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface WorkScheduleItem {
  id: number
  dayOfWeek: DayOfWeek
  startTime: string  // HH:mm:ss
  endTime: string    // HH:mm:ss
}

export interface WorkSchedulePayload {
  dayOfWeek: DayOfWeek
  startTime: string  // HH:mm:ss
  endTime: string    // HH:mm:ss
}

export const getMyWorkSchedule = () =>
  baseClient.get<WorkScheduleItem[]>('/api/v1/work-schedules/me')

export const upsertWorkScheduleDay = (body: WorkSchedulePayload) =>
  baseClient.put<WorkScheduleItem>('/api/v1/work-schedules', body)
