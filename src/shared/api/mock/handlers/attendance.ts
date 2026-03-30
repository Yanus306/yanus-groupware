import { http, HttpResponse } from 'msw'
import type {
  DayOfWeek,
  MemberWorkScheduleItem,
  WeekPattern,
  WorkScheduleEventItem,
  WorkScheduleItem,
} from '../../attendanceApi'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 로그인한 유저(memberId=1)의 오늘 출퇴근 기록 상태 (mock 런타임 내 유지)
let myRecord: {
  id: number; memberId: number; memberName: string
  workDate: string; checkInTime: string; checkOutTime: string | null; status: 'WORKING' | 'LEFT'
} | null = null

// 근무 일정 mock 데이터
let workSchedules: WorkScheduleItem[] = [
  { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
  { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
  { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'SECOND' },
  { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
  { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'LAST' },
]

let memberWorkSchedules: MemberWorkScheduleItem[] = [
  {
    memberId: 1,
    memberName: '김리더',
    teamName: '1팀',
      workSchedules: [
      { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
      { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
      { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'SECOND' },
    ],
  },
  {
    memberId: 2,
    memberName: '박팀장',
    teamName: '2팀',
      workSchedules: [
      { id: 4, dayOfWeek: 'MONDAY', startTime: '10:00:00', endTime: '19:00:00', weekPattern: 'EVERY' },
      { id: 5, dayOfWeek: 'THURSDAY', startTime: '10:00:00', endTime: '19:00:00', weekPattern: 'EVERY' },
    ],
  },
  {
    memberId: 4,
    memberName: '최개발',
    teamName: '1팀',
      workSchedules: [
      { id: 6, dayOfWeek: 'FRIDAY', startTime: '09:30:00', endTime: '18:30:00', weekPattern: 'LAST' },
    ],
  },
]

function syncMyMemberWorkSchedules() {
  memberWorkSchedules = memberWorkSchedules.map((item) =>
    item.memberId === 1
      ? {
          ...item,
          workSchedules,
        }
      : item,
  )
}

let workScheduleEvents: WorkScheduleEventItem[] = [
  {
    id: 101,
    date: '2026-03-31',
    startTime: '13:00:00',
    endTime: '18:00:00',
    memberId: 1,
    memberName: '김리더',
    teamName: '1팀',
  },
  {
    id: 102,
    date: '2026-04-02',
    startTime: '11:00:00',
    endTime: '16:00:00',
    memberId: 4,
    memberName: '최개발',
    teamName: '1팀',
  },
]

export function resetAttendanceMockData() {
  myRecord = null
}

export const attendanceHandlers = [
  http.get('/api/v1/attendances', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') ?? todayStr()
    const records = myRecord && myRecord.workDate === date ? [myRecord] : []
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: records })
  }),

  http.get('/api/v1/attendances/me', () => {
    const data = myRecord ? [myRecord] : []
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })
  }),

  http.delete('/api/v1/attendances/me', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') ?? todayStr()

    if (!myRecord || myRecord.workDate !== date) {
      return HttpResponse.json(
        { code: 'NOT_CHECKED_IN', message: '출근 기록이 없습니다.', data: null },
        { status: 400 },
      )
    }

    myRecord = null
    return new HttpResponse(null, { status: 200 })
  }),

  http.post('/api/v1/attendances/check-in', () => {
    const today = todayStr()
    if (myRecord && myRecord.workDate === today) {
      return HttpResponse.json(
        { code: 'ALREADY_CHECKED_IN', message: '이미 출근 처리되었습니다.', data: null },
        { status: 409 },
      )
    }
    myRecord = {
      id: Date.now(),
      memberId: 1,
      memberName: '김리더',
      workDate: today,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      status: 'WORKING',
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: myRecord })
  }),

  http.post('/api/v1/attendances/check-out', () => {
    const today = todayStr()
    if (!myRecord || myRecord.workDate !== today) {
      return HttpResponse.json(
        { code: 'NOT_CHECKED_IN', message: '출근 기록이 없습니다.', data: null },
        { status: 400 },
      )
    }
    if (myRecord.status === 'LEFT') {
      return HttpResponse.json(
        { code: 'ALREADY_CHECKED_OUT', message: '이미 퇴근 처리되었습니다.', data: null },
        { status: 400 },
      )
    }
    myRecord = { ...myRecord, checkOutTime: new Date().toISOString(), status: 'LEFT' }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: myRecord })
  }),

  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: workSchedules }),
  ),

  http.get('/api/v1/work-schedules/all', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: memberWorkSchedules }),
  ),

  http.get('/api/v1/work-schedules/team/:teamId', ({ params }) => {
    const teamId = Number(params.teamId)
    const teamName =
      teamId === 1 ? '1팀' :
      teamId === 2 ? '2팀' :
      teamId === 3 ? '3팀' :
      '4팀'

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: memberWorkSchedules.filter((item) => item.teamName === teamName),
    })
  }),

  http.get('/api/v1/work-schedule-events', ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const filtered = workScheduleEvents.filter((item) => {
      if (startDate && item.date < startDate) return false
      if (endDate && item.date > endDate) return false
      return true
    })

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.post('/api/v1/work-schedule-events', async ({ request }) => {
    const body = await request.json() as { date: string; startTime: string; endTime: string }
    const created: WorkScheduleEventItem = {
      id: Date.now(),
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      memberId: 1,
      memberName: '김리더',
      teamName: '1팀',
    }

    workScheduleEvents = [...workScheduleEvents, created]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: created })
  }),

  http.put('/api/v1/work-schedule-events/:eventId', async ({ params, request }) => {
    const eventId = Number(params.eventId)
    const body = await request.json() as { date: string; startTime: string; endTime: string }
    const existing = workScheduleEvents.find((item) => item.id === eventId)

    if (!existing) {
      return HttpResponse.json(
        { code: 'WORK_SCHEDULE_NOT_FOUND', message: '근무 일정이 없습니다.', data: null },
        { status: 404 },
      )
    }

    const updated: WorkScheduleEventItem = {
      ...existing,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
    }

    workScheduleEvents = workScheduleEvents.map((item) => (item.id === eventId ? updated : item))
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.delete('/api/v1/work-schedule-events/:eventId', ({ params }) => {
    const eventId = Number(params.eventId)
    workScheduleEvents = workScheduleEvents.filter((item) => item.id !== eventId)
    return new HttpResponse(null, { status: 200 })
  }),

  http.put('/api/v1/work-schedules', async ({ request }) => {
    const body = await request.json() as {
      dayOfWeek: DayOfWeek
      startTime: string
      endTime: string
      weekPattern?: WeekPattern
    }
    const existing = workSchedules.find((s) => s.dayOfWeek === body.dayOfWeek)
    let updated: WorkScheduleItem
    if (existing) {
      updated = {
        ...existing,
        startTime: body.startTime,
        endTime: body.endTime,
        weekPattern: body.weekPattern ?? existing.weekPattern ?? 'EVERY',
      }
      workSchedules = workSchedules.map((s) => s.dayOfWeek === body.dayOfWeek ? updated : s)
    } else {
      updated = {
        id: Date.now(),
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        weekPattern: body.weekPattern ?? 'EVERY',
      }
      workSchedules = [...workSchedules, updated]
    }
    syncMyMemberWorkSchedules()
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.delete('/api/v1/work-schedules/:dayOfWeek', ({ params }) => {
    const dayOfWeek = String(params.dayOfWeek) as DayOfWeek
    workSchedules = workSchedules.filter((schedule) => schedule.dayOfWeek !== dayOfWeek)
    syncMyMemberWorkSchedules()
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
]
