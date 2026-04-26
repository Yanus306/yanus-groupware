import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMonthlyAttendanceSettlement, updateAttendanceSettlementPaymentStatus } from '../attendanceSettlementApi'

const settlementResponse = {
  yearMonth: '2026-03',
  memberId: 2,
  memberName: '강민준',
  teamName: '1팀',
  scheduledDays: 12,
  attendedDays: 11,
  lateDays: 2,
  totalLateMinutes: 15,
  lateFee: 1500,
  paymentStatus: 'UNPAID',
  paidAmount: 0,
  unpaidAmount: 1500,
  waivedAmount: 0,
  carriedOverAmount: 0,
  paymentProcessedAt: null,
  paymentProcessedBy: null,
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
  http.patch('/api/v1/attendance-settlements/monthly/payment-status', async ({ request }) => {
    const body = await request.json() as {
      yearMonth: string
      targetMemberId: number
      paymentStatus: typeof settlementResponse.paymentStatus
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        ...settlementResponse,
        yearMonth: body.yearMonth,
        memberId: body.targetMemberId,
        paymentStatus: body.paymentStatus,
        paidAmount: body.paymentStatus === 'PAID' ? settlementResponse.lateFee : 0,
        unpaidAmount: body.paymentStatus === 'UNPAID' ? settlementResponse.lateFee : 0,
        waivedAmount: body.paymentStatus === 'WAIVED' ? settlementResponse.lateFee : 0,
        carriedOverAmount: body.paymentStatus === 'CARRIED_OVER' ? settlementResponse.lateFee : 0,
        paymentProcessedAt: '2026-03-31T18:00:00',
        paymentProcessedBy: '관리자',
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
      lateFee: 1500,
      paymentStatus: 'UNPAID',
      unpaidAmount: 1500,
    })
    expect(result.items[0]).toMatchObject({
      date: '2026-03-04',
      status: 'LATE',
      fee: 700,
    })
    expect(result.items[1]).toMatchObject({
      date: '2026-03-07',
      endsNextDay: true,
      scheduledStartAt: '2026-03-07T22:00:00',
      scheduledEndAt: '2026-03-08T06:00:00',
      checkInTime: '2026-03-07T22:08:00',
      checkOutTime: '2026-03-08T06:01:00',
      lateMinutes: 8,
      fee: 800,
    })
  })

  it('관리자는 targetMemberId로 특정 멤버 정산을 조회할 수 있다', async () => {
    const result = await getMonthlyAttendanceSettlement('2026-03', 99)

    expect(result.memberId).toBe(99)
    expect(result.yearMonth).toBe('2026-03')
  })

  it('관리자는 월별 정산 납부 상태를 변경할 수 있다', async () => {
    const result = await updateAttendanceSettlementPaymentStatus({
      yearMonth: '2026-03',
      targetMemberId: 2,
      paymentStatus: 'PAID',
    })

    expect(result).toMatchObject({
      yearMonth: '2026-03',
      memberId: 2,
      paymentStatus: 'PAID',
      paidAmount: 1500,
      unpaidAmount: 0,
      paymentProcessedBy: '관리자',
    })
  })
})
