import { describe, expect, it } from 'vitest'
import { applyNoScheduleAttendanceFee, NO_SCHEDULE_ATTENDANCE_FEE, rollupAttendanceSettlements } from '../attendanceSettlement'
import type { AttendanceRecord } from '../../api/attendanceApi'
import type { AttendanceSettlement } from '../../api/attendanceSettlementApi'

const baseSettlement: AttendanceSettlement = {
  yearMonth: '2026-03',
  memberId: 2,
  memberName: '강민준',
  teamName: '1팀',
  scheduledDays: 12,
  attendedDays: 11,
  lateDays: 2,
  totalLateMinutes: 15,
  lateFee: 1500,
  items: [
    {
      date: '2026-03-04',
      scheduledStartTime: '09:00:00',
      scheduledEndTime: '18:00:00',
      endsNextDay: false,
      scheduledStartAt: '2026-03-04T09:00:00',
      scheduledEndAt: '2026-03-04T18:00:00',
      checkInTime: '2026-03-04T09:07:10',
      checkOutTime: '2026-03-04T18:02:01',
      lateMinutes: 7,
      fee: 700,
      status: 'LATE',
    },
    {
      date: '2026-03-07',
      scheduledStartTime: '22:00:00',
      scheduledEndTime: '06:00:00',
      endsNextDay: true,
      scheduledStartAt: '2026-03-07T22:00:00',
      scheduledEndAt: '2026-03-08T06:00:00',
      checkInTime: '2026-03-07T22:08:00',
      checkOutTime: '2026-03-08T06:01:00',
      lateMinutes: 8,
      fee: 800,
      status: 'LATE',
    },
  ],
}

describe('attendanceSettlement', () => {
  it('근무 일정 미기재 출근은 3000원 정산 항목으로 추가한다', () => {
    const records: AttendanceRecord[] = [
      {
        id: 10,
        memberId: 2,
        memberName: '강민준',
        workDate: '2026-03-18',
        checkInTime: '2026-03-18T09:05:00',
        checkOutTime: '2026-03-18T18:03:00',
        status: 'LEFT',
      },
    ]

    const result = applyNoScheduleAttendanceFee(baseSettlement, records)

    expect(result.lateFee).toBe(1500 + NO_SCHEDULE_ATTENDANCE_FEE)
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: '2026-03-18',
          status: 'NO_SCHEDULE',
          fee: NO_SCHEDULE_ATTENDANCE_FEE,
        }),
      ]),
    )
  })

  it('전체 정산 요약은 멤버별 정산을 합산한다', () => {
    const settlements = [
      baseSettlement,
      {
        ...baseSettlement,
        memberId: 3,
        memberName: '김민준',
        lateFee: 3000,
        lateDays: 1,
        items: [
          {
            date: '2026-03-18',
            scheduledStartTime: '',
            scheduledEndTime: '',
            endsNextDay: false,
            scheduledStartAt: null,
            scheduledEndAt: null,
            checkInTime: '2026-03-18T09:05:00',
            checkOutTime: '2026-03-18T18:03:00',
            lateMinutes: 0,
            fee: 3000,
            status: 'NO_SCHEDULE' as const,
          },
        ],
      },
    ]

    const summary = rollupAttendanceSettlements(settlements)

    expect(summary.memberCount).toBe(2)
    expect(summary.totalLateFee).toBe(4500)
    expect(summary.noScheduleAttendanceCount).toBe(1)
  })

  it('야간 근무 지각 정산 항목은 다음날 종료 계약을 유지한 채 합산한다', () => {
    const summary = rollupAttendanceSettlements([baseSettlement])
    const overnightItem = baseSettlement.items.find((item) => item.endsNextDay)

    expect(overnightItem).toMatchObject({
      scheduledStartTime: '22:00:00',
      scheduledEndTime: '06:00:00',
      scheduledStartAt: '2026-03-07T22:00:00',
      scheduledEndAt: '2026-03-08T06:00:00',
      checkInTime: '2026-03-07T22:08:00',
      checkOutTime: '2026-03-08T06:01:00',
      lateMinutes: 8,
      fee: 800,
      status: 'LATE',
    })
    expect(summary.totalLateMinutes).toBe(15)
    expect(summary.totalLateFee).toBe(1500)
  })
})
