import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  createWorkScheduleEvent,
  deleteWorkScheduleEvent,
  getMyAttendance,
  getAttendanceByDate,
  clockIn,
  clockOut,
  resetMyAttendance,
  getMyWorkSchedule,
  upsertWorkScheduleDay,
  deleteWorkScheduleDay,
  getAllWorkSchedules,
  getTeamWorkSchedules,
  getWorkScheduleEvents,
  updateWorkScheduleEvent,
} from '../attendanceApi'

const WORK_SCHEDULES = [
  { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
  { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
  { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'SECOND' },
  { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
  { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'LAST' },
]

const WORK_SCHEDULE_EVENTS = [
  {
    id: 101,
    date: '2026-03-31',
    startTime: '13:00:00',
    endTime: '18:00:00',
    memberId: 1,
    memberName: '김리더',
    teamName: '1팀',
  },
]

const MEMBER_WORK_SCHEDULES = [
  {
    memberId: 1,
    memberName: '김리더',
    teamName: '1팀',
    workSchedules: WORK_SCHEDULES,
  },
  {
    memberId: 2,
    memberName: '박팀장',
    teamName: '2팀',
    schedules: [
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
      data: MEMBER_WORK_SCHEDULES.filter((item) => String(params.teamId) === (item.teamName === '1팀' ? '1' : '2')),
    }),
  ),
  http.get('/api/v1/work-schedule-events', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: WORK_SCHEDULE_EVENTS }),
  ),
  http.post('/api/v1/work-schedule-events', async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: 999, memberId: 1, memberName: '김리더', teamName: '1팀', ...body },
    })
  }),
  http.put('/api/v1/work-schedule-events/:eventId', async ({ request, params }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: Number(params.eventId), memberId: 1, memberName: '김리더', teamName: '1팀', ...body },
    })
  }),
  http.delete('/api/v1/work-schedule-events/:eventId', () => new HttpResponse(null, { status: 200 })),
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
  http.delete('/api/v1/attendances/me', () =>
    new HttpResponse(null, { status: 200 }),
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

  it('resetMyAttendance() 오늘 출근 기록을 초기화한다', async () => {
    await expect(resetMyAttendance('2026-03-22')).resolves.toBeNull()
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
    const result = await upsertWorkScheduleDay({
      dayOfWeek: 'MONDAY',
      startTime: '08:00:00',
      endTime: '17:00:00',
      weekPattern: 'FIRST',
    })
    expect(result.dayOfWeek).toBe('MONDAY')
    expect(result.startTime).toBe('08:00:00')
    expect(result.endTime).toBe('17:00:00')
    expect(result.weekPattern).toBe('FIRST')
  })

  it('deleteWorkScheduleDay() 특정 요일 근무 일정을 삭제한다', async () => {
    await expect(deleteWorkScheduleDay('MONDAY')).resolves.toBeNull()
  })

  it('getAllWorkSchedules() 전체 멤버 근무 일정을 반환한다', async () => {
    const schedules = await getAllWorkSchedules()
    expect(schedules).toHaveLength(2)
    expect(schedules[0]).toMatchObject({ memberName: '김리더', teamName: '1팀' })
    expect(schedules[1].workSchedules).toHaveLength(1)
  })

  it('getTeamWorkSchedules() 특정 팀 멤버 근무 일정을 반환한다', async () => {
    const schedules = await getTeamWorkSchedules(1)
    expect(schedules).toHaveLength(1)
    expect(schedules[0]).toMatchObject({ memberName: '김리더', teamName: '1팀' })
  })

  it('getWorkScheduleEvents() 날짜 범위의 근무 일정 이벤트를 반환한다', async () => {
    const events = await getWorkScheduleEvents('2026-03-01', '2026-03-31')
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ memberName: '김리더', date: '2026-03-31' })
  })

  it('createWorkScheduleEvent() 날짜별 근무 일정을 생성한다', async () => {
    const result = await createWorkScheduleEvent({
      date: '2026-03-30',
      startTime: '09:00:00',
      endTime: '18:00:00',
    })

    expect(result).toMatchObject({ id: 999, date: '2026-03-30', memberName: '김리더' })
  })

  it('updateWorkScheduleEvent() 날짜별 근무 일정을 수정한다', async () => {
    const result = await updateWorkScheduleEvent(101, {
      date: '2026-03-31',
      startTime: '10:00:00',
      endTime: '19:00:00',
    })

    expect(result).toMatchObject({ id: 101, startTime: '10:00:00', endTime: '19:00:00' })
  })

  it('deleteWorkScheduleEvent() 날짜별 근무 일정을 삭제한다', async () => {
    await expect(deleteWorkScheduleEvent(101)).resolves.toBeNull()
  })
})
