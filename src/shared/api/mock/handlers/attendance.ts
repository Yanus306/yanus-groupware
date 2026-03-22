import { http, HttpResponse } from 'msw'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 로그인한 유저(memberId=1)의 오늘 출퇴근 기록 상태 (mock 런타임 내 유지)
let myRecord: {
  id: number; memberId: number; memberName: string
  workDate: string; checkInTime: string; checkOutTime: string | null; status: 'WORKING' | 'LEFT'
} | null = null

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
        { code: 'ATT_001', message: '이미 출근 처리되었습니다.', data: null },
        { status: 400 },
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
        { code: 'ATT_002', message: '출근 기록이 없습니다.', data: null },
        { status: 400 },
      )
    }
    if (myRecord.status === 'LEFT') {
      return HttpResponse.json(
        { code: 'ATT_003', message: '이미 퇴근 처리되었습니다.', data: null },
        { status: 400 },
      )
    }
    myRecord = { ...myRecord, checkOutTime: new Date().toISOString(), status: 'LEFT' }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: myRecord })
  }),
]
