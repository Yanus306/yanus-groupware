import type { AttendanceRecord } from '../api/attendanceApi'
import type {
  AttendanceSettlement,
  AttendanceSettlementItem,
  AttendanceSettlementPaymentStatus,
} from '../api/attendanceSettlementApi'

export const NO_SCHEDULE_ATTENDANCE_FEE = 3000

export interface AttendanceSettlementRollup {
  memberCount: number
  scheduledDays: number
  attendedDays: number
  lateDays: number
  totalLateMinutes: number
  totalLateFee: number
  noScheduleAttendanceCount: number
  paidAmount: number
  unpaidAmount: number
  waivedAmount: number
  carriedOverAmount: number
}

export function getSettlementPaymentStatus(settlement: Pick<AttendanceSettlement, 'paymentStatus'>): AttendanceSettlementPaymentStatus {
  return settlement.paymentStatus ?? 'UNPAID'
}

export function getSettlementPaymentAmounts(
  settlement: Pick<AttendanceSettlement, 'lateFee' | 'paymentStatus'>,
) {
  const paymentStatus = getSettlementPaymentStatus(settlement)
  const amount = settlement.lateFee

  return {
    paidAmount: paymentStatus === 'PAID' ? amount : 0,
    unpaidAmount: paymentStatus === 'UNPAID' ? amount : 0,
    waivedAmount: paymentStatus === 'WAIVED' ? amount : 0,
    carriedOverAmount: paymentStatus === 'CARRIED_OVER' ? amount : 0,
  }
}

function sortItemsByDate(left: AttendanceSettlementItem, right: AttendanceSettlementItem) {
  return left.date.localeCompare(right.date)
}

export function applyNoScheduleAttendanceFee(
  settlement: AttendanceSettlement,
  attendanceRecords: AttendanceRecord[],
): AttendanceSettlement {
  const recordsByDate = new Map(attendanceRecords.map((record) => [record.workDate, record]))
  const nextItems: AttendanceSettlementItem[] = settlement.items.map((item) => {
    const matchingRecord = recordsByDate.get(item.date)
    const checkedInWithoutSchedule = item.status === 'NO_SCHEDULE' && Boolean(item.checkInTime ?? matchingRecord?.checkInTime)

    if (!checkedInWithoutSchedule) {
      return item
    }

    return {
      ...item,
      checkInTime: item.checkInTime ?? matchingRecord?.checkInTime ?? null,
      checkOutTime: item.checkOutTime ?? matchingRecord?.checkOutTime ?? null,
      fee: NO_SCHEDULE_ATTENDANCE_FEE,
    }
  })

  const itemDates = new Set(nextItems.map((item) => item.date))
  const extraNoScheduleItems = attendanceRecords
    .filter((record) => !itemDates.has(record.workDate))
    .map<AttendanceSettlementItem>((record) => ({
      date: record.workDate,
      scheduledStartTime: '',
      scheduledEndTime: '',
      endsNextDay: false,
      scheduledStartAt: null,
      scheduledEndAt: null,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      lateMinutes: 0,
      fee: NO_SCHEDULE_ATTENDANCE_FEE,
      status: 'NO_SCHEDULE',
    }))

  const allItems = [...nextItems, ...extraNoScheduleItems].sort(sortItemsByDate)
  const lateDays = allItems.filter((item) => item.fee > 0).length
  const lateFee = allItems.reduce((sum, item) => sum + item.fee, 0)

  const nextSettlement = {
    ...settlement,
    attendedDays: Math.max(
      settlement.attendedDays,
      new Set(attendanceRecords.map((record) => record.workDate)).size,
    ),
    lateDays,
    lateFee,
    items: allItems,
  }

  return {
    ...nextSettlement,
    ...getSettlementPaymentAmounts(nextSettlement),
  }
}

export function rollupAttendanceSettlements(settlements: AttendanceSettlement[]): AttendanceSettlementRollup {
  return settlements.reduce<AttendanceSettlementRollup>(
    (summary, settlement) => {
      const noScheduleAttendanceCount = settlement.items.filter(
        (item) => item.status === 'NO_SCHEDULE' && item.fee === NO_SCHEDULE_ATTENDANCE_FEE,
      ).length
      const paymentAmounts = getSettlementPaymentAmounts(settlement)

      return {
        memberCount: summary.memberCount + 1,
        scheduledDays: summary.scheduledDays + settlement.scheduledDays,
        attendedDays: summary.attendedDays + settlement.attendedDays,
        lateDays: summary.lateDays + settlement.lateDays,
        totalLateMinutes: summary.totalLateMinutes + settlement.totalLateMinutes,
        totalLateFee: summary.totalLateFee + settlement.lateFee,
        noScheduleAttendanceCount: summary.noScheduleAttendanceCount + noScheduleAttendanceCount,
        paidAmount: summary.paidAmount + paymentAmounts.paidAmount,
        unpaidAmount: summary.unpaidAmount + paymentAmounts.unpaidAmount,
        waivedAmount: summary.waivedAmount + paymentAmounts.waivedAmount,
        carriedOverAmount: summary.carriedOverAmount + paymentAmounts.carriedOverAmount,
      }
    },
    {
      memberCount: 0,
      scheduledDays: 0,
      attendedDays: 0,
      lateDays: 0,
      totalLateMinutes: 0,
      totalLateFee: 0,
      noScheduleAttendanceCount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      waivedAmount: 0,
      carriedOverAmount: 0,
    },
  )
}
