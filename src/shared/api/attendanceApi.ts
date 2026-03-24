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

// OpenAPI 스펙 기준: /api/v1/attendances/me 는 query param 없음
export const getMyAttendance = () =>
  baseClient.get<AttendanceRecord[]>('/api/v1/attendances/me')

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

export interface MemberWorkScheduleItem {
  memberId: number
  memberName: string
  teamName: string
  workSchedules: WorkScheduleItem[]
}

export const getMyWorkSchedule = () =>
  baseClient.get<WorkScheduleItem[]>('/api/v1/work-schedules/me')

export const upsertWorkScheduleDay = (body: WorkSchedulePayload) =>
  baseClient.put<WorkScheduleItem>('/api/v1/work-schedules', body)

export const deleteWorkScheduleDay = (dayOfWeek: DayOfWeek) =>
  baseClient.delete<null>(`/api/v1/work-schedules/${dayOfWeek}`)

export const getAllWorkSchedules = () =>
  baseClient.get<MemberWorkScheduleItem[]>('/api/v1/work-schedules/all')

export const getTeamWorkSchedules = (teamId: number) =>
  baseClient.get<MemberWorkScheduleItem[]>(`/api/v1/work-schedules/team/${teamId}`)
