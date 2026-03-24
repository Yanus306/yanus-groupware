import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  getMyAttendance,
  getAttendanceByDate,
  clockIn,
  clockOut,
  getMyWorkSchedule,
  upsertWorkScheduleDay,
  deleteWorkScheduleDay,
  getAllWorkSchedules,
  getTeamWorkSchedules,
} from '../attendanceApi'

const WORK_SCHEDULES = [
  { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00' },
]

const MEMBER_WORK_SCHEDULES = [
  {
    memberId: 1,
    memberName: '김리더',
    teamName: 'BACKEND',
    workSchedules: WORK_SCHEDULES,
  },
  {
    memberId: 2,
    memberName: '박팀장',
    teamName: 'FRONTEND',
    workSchedules: [
      { id: 6, dayOfWeek: 'MONDAY', startTime: '10:00:00', endTime: '19:00:00' },
    ],
  },
]

const server = setupServer(
  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: WORK_SCHEDULES }),
  ),
  http.put('/api/v1/work-schedules', async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { id: Date.now(), ...body } })
  }),
  http.delete('/api/v1/work-schedules/:dayOfWeek', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
  http.get('/api/v1/work-schedules/all', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: MEMBER_WORK_SCHEDULES }),
  ),
  http.get('/api/v1/work-schedules/team/:teamId', ({ params }) =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: MEMBER_WORK_SCHEDULES.filter((item) => String(params.teamId) === (item.teamName === 'BACKEND' ? '1' : '2')),
    }),
  ),
  http.get('/api/v1/attendances/me', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const record = {
      id: 1,
      memberId: 1,
      memberName: '김리더',
      workDate: '2026-03-22',
      checkInTime: '2026-03-22T09:02:00',
      checkOutTime: '2026-03-22T18:05:00',
      status: 'LEFT',
    }
    const data = !date || date === '2026-03-22' ? [record] : []
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })
  }),
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

describe('workScheduleApi', () => {
  it('getMyWorkSchedule() 내 근무 일정 배열을 반환한다', async () => {
    const schedules = await getMyWorkSchedule()
    expect(Array.isArray(schedules)).toBe(true)
    expect(schedules).toHaveLength(5)
    expect(schedules[0]).toMatchObject({ dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' })
  })

  it('upsertWorkScheduleDay() 특정 요일 근무 일정을 저장하고 반환한다', async () => {
    const result = await upsertWorkScheduleDay({ dayOfWeek: 'MONDAY', startTime: '08:00:00', endTime: '17:00:00' })
    expect(result.dayOfWeek).toBe('MONDAY')
    expect(result.startTime).toBe('08:00:00')
    expect(result.endTime).toBe('17:00:00')
  })

  it('deleteWorkScheduleDay() 특정 요일 근무 일정을 삭제한다', async () => {
    await expect(deleteWorkScheduleDay('MONDAY')).resolves.toBeNull()
  })

  it('getAllWorkSchedules() 전체 멤버 근무 일정을 반환한다', async () => {
    const schedules = await getAllWorkSchedules()
    expect(schedules).toHaveLength(2)
    expect(schedules[0]).toMatchObject({ memberName: '김리더', teamName: 'BACKEND' })
  })

  it('getTeamWorkSchedules() 특정 팀 멤버 근무 일정을 반환한다', async () => {
    const schedules = await getTeamWorkSchedules(1)
    expect(schedules).toHaveLength(1)
    expect(schedules[0]).toMatchObject({ memberName: '김리더', teamName: 'BACKEND' })
  })
})
