import { baseClient } from './baseClient'

export type AttendanceSettlementItemStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'NO_SCHEDULE'
export type AttendanceSettlementPaymentStatus = 'UNPAID' | 'PAID' | 'WAIVED' | 'CARRIED_OVER'

export interface AttendanceSettlementItem {
  date: string
  scheduledStartTime: string
  scheduledEndTime: string
  endsNextDay?: boolean
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
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
  paymentStatus?: AttendanceSettlementPaymentStatus
  paidAmount?: number
  unpaidAmount?: number
  waivedAmount?: number
  carriedOverAmount?: number
  paymentProcessedAt?: string | null
  paymentProcessedBy?: string | null
  items: AttendanceSettlementItem[]
}

export interface AttendanceSettlementPaymentUpdatePayload {
  yearMonth: string
  targetMemberId: number
  paymentStatus: AttendanceSettlementPaymentStatus
}

export const getMonthlyAttendanceSettlement = (yearMonth: string, targetMemberId?: number) => {
  const params = new URLSearchParams({ yearMonth })
  if (typeof targetMemberId === 'number') {
    params.set('targetMemberId', String(targetMemberId))
  }

  return baseClient.get<AttendanceSettlement>(`/api/v1/attendance-settlements/monthly?${params.toString()}`)
}

export const updateAttendanceSettlementPaymentStatus = (payload: AttendanceSettlementPaymentUpdatePayload) =>
  baseClient.patch<AttendanceSettlement>('/api/v1/attendance-settlements/monthly/payment-status', payload)
