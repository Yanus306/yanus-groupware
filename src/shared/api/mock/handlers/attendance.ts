import { http, HttpResponse } from 'msw'
import type { DayOfWeek, WorkScheduleItem } from '../../attendanceApi'

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
  { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00' },
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

  http.put('/api/v1/work-schedules', async ({ request }) => {
    const body = await request.json() as { dayOfWeek: DayOfWeek; startTime: string; endTime: string }
    const existing = workSchedules.find((s) => s.dayOfWeek === body.dayOfWeek)
    let updated: WorkScheduleItem
    if (existing) {
      updated = { ...existing, startTime: body.startTime, endTime: body.endTime }
      workSchedules = workSchedules.map((s) => s.dayOfWeek === body.dayOfWeek ? updated : s)
    } else {
      updated = { id: Date.now(), dayOfWeek: body.dayOfWeek, startTime: body.startTime, endTime: body.endTime }
      workSchedules = [...workSchedules, updated]
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.delete('/api/v1/work-schedules/:dayOfWeek', ({ params }) => {
    const dayOfWeek = String(params.dayOfWeek) as DayOfWeek
    workSchedules = workSchedules.filter((schedule) => schedule.dayOfWeek !== dayOfWeek)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
]
