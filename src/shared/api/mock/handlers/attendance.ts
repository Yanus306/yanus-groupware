import { http, HttpResponse } from 'msw'
import type {
  AttendanceRecord,
  DayOfWeek,
  MemberWorkScheduleItem,
  WeekPattern,
  WorkScheduleEventItem,
  WorkScheduleItem,
} from '../../attendanceApi'
import type { User } from '../../../../entities/user/model/types'
import { getAuthMockUserByAuthorization } from './auth'
import { getTodayStr } from '../../../lib/date'

const today = getTodayStr()

const mockRecords: AttendanceRecord[] = [
  { id: 1, memberId: 1, memberName: '김리더', workDate: today, checkInTime: `${today}T09:02:00`, checkOutTime: `${today}T18:15:00`, status: 'LEFT' },
  { id: 2, memberId: 2, memberName: '박팀장', workDate: today, checkInTime: `${today}T09:45:00`, checkOutTime: null, status: 'WORKING' },
  { id: 3, memberId: 3, memberName: '이멤버', workDate: today, checkInTime: `${today}T09:00:00`, checkOutTime: null, status: 'WORKING' },
]

const memberNames: Record<number, string> = {
  1: '김리더',
  2: '박팀장',
  3: '이멤버',
  4: '최개발',
}

const memberTeams: Record<number, string> = {
  1: '1팀',
  2: '2팀',
  3: '3팀',
  4: '1팀',
}

let myRecordsByMemberId: Record<number, AttendanceRecord | null> = {}

function getAuthenticatedUser(request: Request) {
  return getAuthMockUserByAuthorization(request.headers.get('Authorization'))
}

function unauthorizedResponse() {
  return HttpResponse.json(
    { code: 'UNAUTHORIZED', message: '인증이 필요합니다', data: null },
    { status: 401 },
  )
}

function forbiddenResponse() {
  return HttpResponse.json(
    { code: 'FORBIDDEN', message: '접근 권한이 없습니다', data: null },
    { status: 403 },
  )
}

function getTeamNameByMemberId(memberId: number) {
  return memberTeams[memberId] ?? '4팀'
}

function getTeamIdByName(teamName: string | undefined) {
  const matched = /^([1-4])팀$/.exec(teamName ?? '')
  return matched ? Number(matched[1]) : null
}

function isValidTeamId(teamId: number) {
  return Number.isInteger(teamId) && teamId >= 1 && teamId <= 4
}

function canReadTeam(user: User, teamId: number) {
  if (!isValidTeamId(teamId)) return false
  if (user.role === 'ADMIN') return true
  return user.role === 'TEAM_LEAD' && getTeamIdByName(user.team) === teamId
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isValidTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const matched = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!matched) return false
  const [, hours, minutes, seconds = '00'] = matched
  return Number(hours) <= 23 && Number(minutes) <= 59 && Number(seconds) <= 59
}

const DAY_OF_WEEK_VALUES: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
]
const WEEK_PATTERN_VALUES: WeekPattern[] = ['EVERY', 'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'LAST']

function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === 'string' && DAY_OF_WEEK_VALUES.includes(value as DayOfWeek)
}

function isWeekPattern(value: unknown): value is WeekPattern {
  return typeof value === 'string' && WEEK_PATTERN_VALUES.includes(value as WeekPattern)
}

function invalidInputResponse() {
  return HttpResponse.json(
    { code: 'INVALID_INPUT', message: '요청 값이 유효하지 않습니다.', data: null },
    { status: 400 },
  )
}

function isValidDateRange(startDate: string | null, endDate: string | null) {
  if (startDate !== null && !isValidDate(startDate)) return false
  if (endDate !== null && !isValidDate(endDate)) return false
  return !(startDate && endDate && startDate > endDate)
}

function isValidEventBody(value: unknown): value is {
  date: string
  eventType?: 'WORKING' | 'DAY_OFF'
  startTime: string | null
  endTime: string | null
  endsNextDay?: boolean
  reason?: string | null
} {
  if (!isRecord(value) || !isValidDate(value.date)) return false
  const eventType = value.eventType ?? 'WORKING'
  if (eventType !== 'WORKING' && eventType !== 'DAY_OFF') return false
  if (!('startTime' in value) || !('endTime' in value)) return false
  if (eventType === 'DAY_OFF') {
    if (value.startTime !== null || value.endTime !== null) return false
  } else if (!isValidTime(value.startTime) || !isValidTime(value.endTime)) {
    return false
  }
  if ('endsNextDay' in value && typeof value.endsNextDay !== 'boolean') return false
  if ('reason' in value && value.reason !== null && typeof value.reason !== 'string') return false
  return true
}

function isValidWorkScheduleBody(value: unknown): value is {
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  weekPattern?: WeekPattern
  endsNextDay?: boolean
} {
  if (!isRecord(value) || !isDayOfWeek(value.dayOfWeek)) return false
  if (!isValidTime(value.startTime) || !isValidTime(value.endTime)) return false
  if ('weekPattern' in value && value.weekPattern !== undefined && !isWeekPattern(value.weekPattern)) return false
  if ('endsNextDay' in value && typeof value.endsNextDay !== 'boolean') return false
  return true
}

function getRecordsForDate(date: string, user?: User) {
  const records = mockRecords.filter((record) => record.workDate === date)
  const overrides = Object.entries(myRecordsByMemberId)
    .map(([memberId, record]) => ({ memberId: Number(memberId), record }))
  const overriddenMemberIds = new Set(overrides.map(({ memberId }) => memberId))
  const visibleRecords = records.filter((record) => !overriddenMemberIds.has(record.memberId))
  const dynamicRecords = overrides
    .map(({ record }) => record)
    .filter((record): record is AttendanceRecord => record?.workDate === date)
  const allRecords = [...visibleRecords, ...dynamicRecords]

  if (!user) return allRecords
  if (user.role === 'ADMIN') return allRecords
  if (user.role === 'TEAM_LEAD') return allRecords.filter((record) => getTeamNameByMemberId(record.memberId) === user.team)
  return allRecords.filter((record) => record.memberId === Number(user.id))
}

function createWorkSchedulesByMemberId(): Record<number, WorkScheduleItem[]> {
  return {
    1: [
      { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
      { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
      { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'SECOND' },
      { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY' },
      { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'LAST' },
    ],
    2: [
      { id: 6, dayOfWeek: 'MONDAY', startTime: '10:00:00', endTime: '19:00:00', weekPattern: 'EVERY' },
      { id: 7, dayOfWeek: 'THURSDAY', startTime: '10:00:00', endTime: '19:00:00', weekPattern: 'EVERY' },
    ],
    3: [
      { id: 8, dayOfWeek: 'MONDAY', startTime: '08:30:00', endTime: '17:30:00', weekPattern: 'EVERY' },
      { id: 9, dayOfWeek: 'WEDNESDAY', startTime: '08:30:00', endTime: '17:30:00', weekPattern: 'EVERY' },
      { id: 10, dayOfWeek: 'FRIDAY', startTime: '08:30:00', endTime: '17:30:00', weekPattern: 'EVERY' },
    ],
    4: [
      { id: 11, dayOfWeek: 'FRIDAY', startTime: '22:00:00', endTime: '06:00:00', weekPattern: 'LAST', endsNextDay: true },
    ],
  }
}

let workSchedulesByMemberId = createWorkSchedulesByMemberId()

function getWorkSchedulesForMember(memberId: number) {
  return workSchedulesByMemberId[memberId] ?? []
}

function createMemberWorkSchedules(): MemberWorkScheduleItem[] {
  return [
    { memberId: 1, memberName: '김리더', teamName: '1팀', workSchedules: getWorkSchedulesForMember(1) },
    { memberId: 2, memberName: '박팀장', teamName: '2팀', workSchedules: getWorkSchedulesForMember(2) },
    { memberId: 3, memberName: '이멤버', teamName: '3팀', workSchedules: getWorkSchedulesForMember(3) },
    { memberId: 4, memberName: '최개발', teamName: '1팀', workSchedules: getWorkSchedulesForMember(4) },
  ]
}

let memberWorkSchedules = createMemberWorkSchedules()

function syncMemberWorkSchedules(memberId: number) {
  memberWorkSchedules = memberWorkSchedules.map((item) =>
    item.memberId === memberId
      ? { ...item, workSchedules: getWorkSchedulesForMember(memberId) }
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
  if (teamId === 4) return '4팀'
  return null
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
  myRecordsByMemberId = {}
  workSchedulesByMemberId = createWorkSchedulesByMemberId()
  memberWorkSchedules = createMemberWorkSchedules()
  workScheduleEvents = [
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
}

export const attendanceHandlers = [
  http.get('/api/v1/attendances', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const url = new URL(request.url)
    const date = url.searchParams.get('date') ?? getTodayStr()
    if (!isValidDate(date)) return invalidInputResponse()
    const teamIdParam = url.searchParams.get('teamId')
    const requestedTeamId = teamIdParam === null ? null : Number(teamIdParam)
    if (requestedTeamId !== null && !canReadTeam(user, requestedTeamId)) {
      return forbiddenResponse()
    }
    const records = getRecordsForDate(date, user)
    const data = requestedTeamId === null
      ? records
      : records.filter((record) => getTeamIdByName(getTeamNameByMemberId(record.memberId)) === requestedTeamId)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })
  }),

  http.get('/api/v1/attendances/me', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const data = getRecordsForDate(getTodayStr(), user).filter((record) => record.memberId === Number(user.id))
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })
  }),

  http.delete('/api/v1/attendances/me', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const url = new URL(request.url)
    const date = url.searchParams.get('date') ?? getTodayStr()
    if (!isValidDate(date)) return invalidInputResponse()
    const memberId = Number(user.id)

    const existingRecord = getRecordsForDate(date, user).find((record) => record.memberId === memberId)
    if (!existingRecord) {
      return HttpResponse.json(
        { code: 'NOT_CHECKED_IN', message: '출근 기록이 없습니다.', data: null },
        { status: 400 },
      )
    }

    myRecordsByMemberId[memberId] = null
    return new HttpResponse(null, { status: 200 })
  }),

  http.post('/api/v1/attendances/check-in', ({ request }) => {
    const today = getTodayStr()
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const memberId = Number(user.id)
    const existingRecord = getRecordsForDate(today, user).find((record) => record.memberId === memberId)
    if (existingRecord) {
      return HttpResponse.json(
        { code: 'ALREADY_CHECKED_IN', message: '이미 출근 처리되었습니다.', data: null },
        { status: 409 },
      )
    }
    myRecordsByMemberId[memberId] = {
      id: Date.now(),
      memberId,
      memberName: memberNames[memberId] ?? '김리더',
      workDate: today,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      status: 'WORKING',
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: myRecordsByMemberId[memberId] })
  }),

  http.post('/api/v1/attendances/check-out', ({ request }) => {
    const today = getTodayStr()
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const memberId = Number(user.id)
    const existingRecord = myRecordsByMemberId[memberId]?.memberId === memberId
      ? myRecordsByMemberId[memberId]
      : getRecordsForDate(today, user).find((record) => record.memberId === memberId)
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
    myRecordsByMemberId[memberId] = { ...existingRecord, checkOutTime: new Date().toISOString(), status: 'LEFT' }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: myRecordsByMemberId[memberId] })
  }),

  http.get('/api/v1/work-schedules/me', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: getWorkSchedulesForMember(Number(user.id)) })
  }),

  http.get('/api/v1/work-schedules/all', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'ADMIN') return forbiddenResponse()
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: memberWorkSchedules })
  }),

  http.get('/api/v1/work-schedules/team/:teamId', ({ params, request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const teamId = Number(params.teamId)
    const teamName = getTeamNameById(teamId)
    if (!teamName || !canReadTeam(user, teamId)) return forbiddenResponse()

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: memberWorkSchedules.filter((item) => item.teamName === teamName),
    })
  }),

  http.get('/api/v1/work-schedule-events', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    if (!isValidDateRange(startDate, endDate)) return invalidInputResponse()

    const filtered = filterWorkScheduleEventsByDate(
      workScheduleEvents.filter((item) => item.memberId === Number(user.id)),
      startDate,
      endDate,
    )

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.get('/api/v1/work-schedule-events/team/:teamId', ({ params, request }) => {
    const user = getAuthenticatedUser(request)
    const url = new URL(request.url)
    if (!user) return unauthorizedResponse()
    const teamId = Number(params.teamId)
    if (!isValidTeamId(teamId) || !canReadTeam(user, teamId)) return forbiddenResponse()
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    if (!isValidDateRange(startDate, endDate)) return invalidInputResponse()
    const teamName = getTeamNameById(teamId)
    if (!teamName) return forbiddenResponse()
    const filtered = filterWorkScheduleEventsByDate(
      workScheduleEvents.filter((item) => item.teamName === teamName),
      startDate,
      endDate,
    )

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.get('/api/v1/work-schedule-events/all', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'ADMIN') return forbiddenResponse()
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    if (!isValidDateRange(startDate, endDate)) return invalidInputResponse()
    const filtered = filterWorkScheduleEventsByDate(workScheduleEvents, startDate, endDate)

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.post('/api/v1/work-schedule-events', async ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const memberId = Number(user.id)
    const body = await request.json() as unknown
    if (!isValidEventBody(body)) return invalidInputResponse()
    const eventType = body.eventType ?? 'WORKING'
    const created: WorkScheduleEventItem = {
      id: Date.now(),
      date: body.date,
      eventType,
      startTime: eventType === 'DAY_OFF' ? null : body.startTime,
      endTime: eventType === 'DAY_OFF' ? null : body.endTime,
      endsNextDay: eventType === 'DAY_OFF' ? false : Boolean(body.endsNextDay),
      reason: body.reason ?? null,
      memberId,
      memberName: memberNames[memberId] ?? '김리더',
      teamName: getTeamNameByMemberId(memberId),
    }

    workScheduleEvents = [...workScheduleEvents, created]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: created })
  }),

  http.put('/api/v1/work-schedule-events/:eventId', async ({ params, request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const eventId = Number(params.eventId)
    if (!Number.isInteger(eventId) || eventId <= 0) return invalidInputResponse()
    const body = await request.json() as unknown
    if (!isValidEventBody(body)) return invalidInputResponse()
    const existing = workScheduleEvents.find((item) => item.id === eventId)

    if (!existing) {
      return HttpResponse.json(
        { code: 'WORK_SCHEDULE_NOT_FOUND', message: '근무 일정이 없습니다.', data: null },
        { status: 404 },
      )
    }

    const canEdit = user.role === 'ADMIN'
      || (user.role === 'TEAM_LEAD' && existing.teamName === user.team)
      || existing.memberId === Number(user.id)
    if (!canEdit) return forbiddenResponse()

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

  http.delete('/api/v1/work-schedule-events/:eventId', ({ params, request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const eventId = Number(params.eventId)
    if (!Number.isInteger(eventId) || eventId <= 0) return invalidInputResponse()
    const existing = workScheduleEvents.find((item) => item.id === eventId)
    if (!existing) return new HttpResponse(null, { status: 204 })
    const canDelete = user.role === 'ADMIN'
      || (user.role === 'TEAM_LEAD' && existing.teamName === user.team)
      || existing.memberId === Number(user.id)
    if (!canDelete) return forbiddenResponse()
    workScheduleEvents = workScheduleEvents.filter((item) => item.id !== eventId)
    return new HttpResponse(null, { status: 200 })
  }),

  http.put('/api/v1/work-schedules', async ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const memberId = Number(user.id)
    const body = await request.json() as unknown
    if (!isValidWorkScheduleBody(body)) return invalidInputResponse()
    const currentSchedules = getWorkSchedulesForMember(memberId)
    const existing = currentSchedules.find((s) => s.dayOfWeek === body.dayOfWeek)
    let updated: WorkScheduleItem
    if (existing) {
      updated = {
        ...existing,
        startTime: body.startTime,
        endTime: body.endTime,
        weekPattern: body.weekPattern ?? existing.weekPattern ?? 'EVERY',
        endsNextDay: Boolean(body.endsNextDay),
      }
      workSchedulesByMemberId[memberId] = currentSchedules.map((s) => s.dayOfWeek === body.dayOfWeek ? updated : s)
    } else {
      updated = {
        id: Date.now(),
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        weekPattern: body.weekPattern ?? 'EVERY',
        endsNextDay: Boolean(body.endsNextDay),
      }
      workSchedulesByMemberId[memberId] = [...currentSchedules, updated]
    }
    syncMemberWorkSchedules(memberId)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.delete('/api/v1/work-schedules/:dayOfWeek', ({ params, request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()
    const memberId = Number(user.id)
    const dayOfWeekParam = String(params.dayOfWeek)
    if (!isDayOfWeek(dayOfWeekParam)) return invalidInputResponse()
    const dayOfWeek = dayOfWeekParam
    workSchedulesByMemberId[memberId] = getWorkSchedulesForMember(memberId)
      .filter((schedule) => schedule.dayOfWeek !== dayOfWeek)
    syncMemberWorkSchedules(memberId)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
]
