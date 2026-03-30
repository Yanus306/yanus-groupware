import { baseClient } from './baseClient'

export type AttendanceSettlementItemStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'NO_SCHEDULE'

export interface AttendanceSettlementItem {
  date: string
  scheduledStartTime: string
  scheduledEndTime: string
  checkInTime: string | null
  checkOutTime: string | null
  lateMinutes: number
  fee: number
  status: AttendanceSettlementItemStatus
}

export interface AttendanceSettlement {
  yearMonth: string
  memberId: number
  memberName: string
  teamName: string
  scheduledDays: number
  attendedDays: number
  lateDays: number
  totalLateMinutes: number
  lateFee: number
  items: AttendanceSettlementItem[]
}

export const getMonthlyAttendanceSettlement = (yearMonth: string, targetMemberId?: number) => {
  const params = new URLSearchParams({ yearMonth })
  if (typeof targetMemberId === 'number') {
    params.set('targetMemberId', String(targetMemberId))
  }

  return baseClient.get<AttendanceSettlement>(`/api/v1/attendance-settlements/monthly?${params.toString()}`)
}
