import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMonthlyAttendanceSettlement } from '../attendanceSettlementApi'

const settlementResponse = {
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
      endsNextDay: false,
      scheduledStartAt: '2026-03-04T09:00:00',
      scheduledEndAt: '2026-03-04T18:00:00',
      checkInTime: '2026-03-04T09:07:10',
      checkOutTime: '2026-03-04T18:02:01',
      lateMinutes: 7,
      fee: 700,
      status: 'LATE',
    },
  ],
}

const server = setupServer(
  http.get('/api/v1/attendance-settlements/monthly', ({ request }) => {
    const url = new URL(request.url)
    const yearMonth = url.searchParams.get('yearMonth')
    const targetMemberId = url.searchParams.get('targetMemberId')

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        ...settlementResponse,
        yearMonth: yearMonth ?? settlementResponse.yearMonth,
        memberId: targetMemberId ? Number(targetMemberId) : settlementResponse.memberId,
      },
    })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('attendanceSettlementApi', () => {
  it('월별 지각비 정산 데이터를 조회한다', async () => {
    const result = await getMonthlyAttendanceSettlement('2026-03')

    expect(result).toMatchObject({
      yearMonth: '2026-03',
      memberName: '강민준',
      lateFee: 2700,
    })
    expect(result.items[0]).toMatchObject({
      date: '2026-03-04',
      status: 'LATE',
      fee: 700,
    })
  })

  it('관리자는 targetMemberId로 특정 멤버 정산을 조회할 수 있다', async () => {
    const result = await getMonthlyAttendanceSettlement('2026-03', 99)

    expect(result.memberId).toBe(99)
    expect(result.yearMonth).toBe('2026-03')
  })
})
