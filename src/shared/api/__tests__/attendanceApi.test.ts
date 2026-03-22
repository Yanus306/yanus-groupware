import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMyAttendance, getAttendanceByDate, clockIn, clockOut } from '../attendanceApi'

const server = setupServer(
  http.get('/api/v1/attendances/me', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        {
          id: 1,
          memberId: 1,
          memberName: '김리더',
          workDate: '2026-03-22',
          checkInTime: '2026-03-22T09:02:00',
          checkOutTime: '2026-03-22T18:05:00',
          status: 'LEFT',
        },
      ],
    }),
  ),
  http.get('/api/v1/attendances', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: date
        ? [{ id: 2, memberId: 2, memberName: '박팀장', workDate: date, checkInTime: date + 'T09:00:00', checkOutTime: null, status: 'WORKING' }]
        : [],
    })
  }),
  http.post('/api/v1/attendances/check-in', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: 10, memberId: 1, memberName: '김리더', workDate: '2026-03-22', checkInTime: '2026-03-22T09:05:00', checkOutTime: null, status: 'WORKING' },
    }),
  ),
  http.post('/api/v1/attendances/check-out', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: 10, memberId: 1, memberName: '김리더', workDate: '2026-03-22', checkInTime: '2026-03-22T09:05:00', checkOutTime: '2026-03-22T18:00:00', status: 'LEFT' },
    }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('attendanceApi', () => {
  it('getMyAttendance() 내 출퇴근 기록을 반환한다', async () => {
    const records = await getMyAttendance()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ id: 1, memberName: '김리더', status: 'LEFT' })
  })

  it('getAttendanceByDate() 날짜별 전체 기록을 반환한다', async () => {
    const records = await getAttendanceByDate('2026-03-22')
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ memberName: '박팀장', status: 'WORKING' })
  })

  it('clockIn() 출근 기록을 생성한다', async () => {
    const result = await clockIn()
    expect(result).toMatchObject({ id: 10, status: 'WORKING' })
  })

  it('clockOut() 퇴근 기록을 생성한다', async () => {
    const result = await clockOut()
    expect(result).toMatchObject({ id: 10, status: 'LEFT' })
    expect(result.checkOutTime).not.toBeNull()
  })
})
