import { baseClient } from './baseClient'

export interface AttendanceRecord {
  id: string
  userId: string
  date: string
  clockIn: string
  clockOut?: string
  status: 'working' | 'done'
}

export const getAttendance = () => baseClient.get<AttendanceRecord[]>('/attendance')

export const clockIn = () => baseClient.post<AttendanceRecord>('/attendance/clock-in', {})

export const clockOut = () => baseClient.post<Pick<AttendanceRecord, 'clockOut' | 'status'>>('/attendance/clock-out', {})
