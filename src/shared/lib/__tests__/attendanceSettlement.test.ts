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
  lateDays: 3,
  totalLateMinutes: 27,
  lateFee: 2700,
  items: [
    {
      date: '2026-03-04',
      scheduledStartTime: '09:00:00',
      scheduledEndTime: '18:00:00',
      checkInTime: '2026-03-04T09:07:10',
      checkOutTime: '2026-03-04T18:02:01',
      lateMinutes: 7,
      fee: 700,
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

    expect(result.lateFee).toBe(700 + NO_SCHEDULE_ATTENDANCE_FEE)
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
    expect(summary.totalLateFee).toBe(5700)
    expect(summary.noScheduleAttendanceCount).toBe(1)
  })
})
