import { http, HttpResponse } from 'msw'
import type {
  AttendanceRecord,
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

const mockRecords: AttendanceRecord[] = [
  { id: 1, memberId: 1, memberName: '김리더', workDate: todayStr(), checkInTime: `${todayStr()}T09:02:00`, checkOutTime: `${todayStr()}T18:15:00`, status: 'LEFT' },
  { id: 2, memberId: 2, memberName: '박팀장', workDate: todayStr(), checkInTime: `${todayStr()}T09:45:00`, checkOutTime: null, status: 'WORKING' },
  { id: 3, memberId: 3, memberName: '이멤버', workDate: todayStr(), checkInTime: `${todayStr()}T09:00:00`, checkOutTime: null, status: 'WORKING' },
]

const memberNames: Record<number, string> = {
  1: '김리더',
  2: '박팀장',
  3: '이멤버',
}

let myRecord: AttendanceRecord | null = null

function getMemberId(request: Request) {
  const token = request.headers.get('Authorization') ?? ''
  const parsedId = Number(token.replace('Bearer mock-token-', ''))
  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 1
}

function getRecordsForDate(date: string) {
  const records = mockRecords.filter((record) => record.workDate === date)
  if (!myRecord || myRecord.workDate !== date) return records

  return [...records.filter((record) => record.memberId !== myRecord?.memberId), myRecord]
}

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
      { id: 6, dayOfWeek: 'FRIDAY', startTime: '22:00:00', endTime: '06:00:00', weekPattern: 'LAST', endsNextDay: true },
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

function filterWorkScheduleEventsByDate(items: WorkScheduleEventItem[], startDate: string | null, endDate: string | null) {
  return items.filter((item) => {
    if (startDate && item.date < startDate) return false
    if (endDate && item.date > endDate) return false
    return true
  })
}

function getTeamNameById(teamId: number) {
  if (teamId === 1) return '1팀'
  if (teamId === 2) return '2팀'
  if (teamId === 3) return '3팀'
  return '4팀'
}

let workScheduleEvents: WorkScheduleEventItem[] = [
  {
    id: 101,
    date: '2026-03-31',
    eventType: 'WORKING',
    startTime: '13:00:00',
    endTime: '18:00:00',
    memberId: 1,
    memberName: '김리더',
    teamName: '1팀',
  },
  {
    id: 102,
    date: '2026-04-02',
    eventType: 'WORKING',
    startTime: '22:00:00',
    endTime: '06:00:00',
    endsNextDay: true,
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
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: getRecordsForDate(date) })
  }),

  http.get('/api/v1/attendances/me', ({ request }) => {
    const memberId = getMemberId(request)
    const data = getRecordsForDate(todayStr()).filter((record) => record.memberId === memberId)
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

  http.post('/api/v1/attendances/check-in', ({ request }) => {
    const today = todayStr()
    const memberId = getMemberId(request)
    const existingRecord = getRecordsForDate(today).find((record) => record.memberId === memberId)
    if (existingRecord) {
      return HttpResponse.json(
        { code: 'ALREADY_CHECKED_IN', message: '이미 출근 처리되었습니다.', data: null },
        { status: 409 },
      )
    }
    myRecord = {
      id: Date.now(),
      memberId,
      memberName: memberNames[memberId] ?? '김리더',
      workDate: today,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      status: 'WORKING',
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: myRecord })
  }),

  http.post('/api/v1/attendances/check-out', ({ request }) => {
    const today = todayStr()
    const memberId = getMemberId(request)
    const existingRecord = myRecord?.memberId === memberId
      ? myRecord
      : getRecordsForDate(today).find((record) => record.memberId === memberId)
    if (!existingRecord) {
      return HttpResponse.json(
        { code: 'NOT_CHECKED_IN', message: '출근 기록이 없습니다.', data: null },
        { status: 400 },
      )
    }
    if (existingRecord.status === 'LEFT') {
      return HttpResponse.json(
        { code: 'ALREADY_CHECKED_OUT', message: '이미 퇴근 처리되었습니다.', data: null },
        { status: 400 },
      )
    }
    myRecord = { ...existingRecord, checkOutTime: new Date().toISOString(), status: 'LEFT' }
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
    const teamName = getTeamNameById(teamId)

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

    const filtered = filterWorkScheduleEventsByDate(
      workScheduleEvents.filter((item) => item.memberId === 1),
      startDate,
      endDate,
    )

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.get('/api/v1/work-schedule-events/team/:teamId', ({ params, request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const teamName = getTeamNameById(Number(params.teamId))
    const filtered = filterWorkScheduleEventsByDate(
      workScheduleEvents.filter((item) => item.teamName === teamName),
      startDate,
      endDate,
    )

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.get('/api/v1/work-schedule-events/all', ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const filtered = filterWorkScheduleEventsByDate(workScheduleEvents, startDate, endDate)

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.post('/api/v1/work-schedule-events', async ({ request }) => {
    const body = await request.json() as {
      date: string
      eventType?: 'WORKING' | 'DAY_OFF'
      startTime: string | null
      endTime: string | null
      endsNextDay?: boolean
      reason?: string | null
    }
    const eventType = body.eventType ?? 'WORKING'
    const created: WorkScheduleEventItem = {
      id: Date.now(),
      date: body.date,
      eventType,
      startTime: eventType === 'DAY_OFF' ? null : body.startTime,
      endTime: eventType === 'DAY_OFF' ? null : body.endTime,
      endsNextDay: eventType === 'DAY_OFF' ? false : Boolean(body.endsNextDay),
      reason: body.reason ?? null,
      memberId: 1,
      memberName: '김리더',
      teamName: '1팀',
    }

    workScheduleEvents = [...workScheduleEvents, created]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: created })
  }),

  http.put('/api/v1/work-schedule-events/:eventId', async ({ params, request }) => {
    const eventId = Number(params.eventId)
    const body = await request.json() as {
      date: string
      eventType?: 'WORKING' | 'DAY_OFF'
      startTime: string | null
      endTime: string | null
      endsNextDay?: boolean
      reason?: string | null
    }
    const existing = workScheduleEvents.find((item) => item.id === eventId)

    if (!existing) {
      return HttpResponse.json(
        { code: 'WORK_SCHEDULE_NOT_FOUND', message: '근무 일정이 없습니다.', data: null },
        { status: 404 },
      )
    }

    const eventType = body.eventType ?? 'WORKING'
    const updated: WorkScheduleEventItem = {
      ...existing,
      date: body.date,
      eventType,
      startTime: eventType === 'DAY_OFF' ? null : body.startTime,
      endTime: eventType === 'DAY_OFF' ? null : body.endTime,
      endsNextDay: eventType === 'DAY_OFF' ? false : Boolean(body.endsNextDay),
      reason: body.reason ?? null,
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
      endsNextDay?: boolean
    }
    const existing = workSchedules.find((s) => s.dayOfWeek === body.dayOfWeek)
    let updated: WorkScheduleItem
    if (existing) {
      updated = {
        ...existing,
        startTime: body.startTime,
        endTime: body.endTime,
        weekPattern: body.weekPattern ?? existing.weekPattern ?? 'EVERY',
        endsNextDay: Boolean(body.endsNextDay),
      }
      workSchedules = workSchedules.map((s) => s.dayOfWeek === body.dayOfWeek ? updated : s)
    } else {
      updated = {
        id: Date.now(),
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        weekPattern: body.weekPattern ?? 'EVERY',
        endsNextDay: Boolean(body.endsNextDay),
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
