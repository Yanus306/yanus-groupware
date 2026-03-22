import { http, HttpResponse } from 'msw'

const mockRecords = [
  { id: 1, memberId: 1, memberName: '김리더', workDate: '2026-03-22', checkInTime: '2026-03-22T09:02:00', checkOutTime: '2026-03-22T18:15:00', status: 'LEFT' },
  { id: 2, memberId: 2, memberName: '박팀장', workDate: '2026-03-22', checkInTime: '2026-03-22T09:45:00', checkOutTime: '2026-03-22T18:30:00', status: 'LEFT' },
  { id: 3, memberId: 3, memberName: '이멤버', workDate: '2026-03-22', checkInTime: '2026-03-22T09:00:00', checkOutTime: null, status: 'WORKING' },
]

export const attendanceHandlers = [
  http.get('/api/v1/attendances', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const filtered = date ? mockRecords.filter((r) => r.workDate === date) : mockRecords
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

  http.get('/api/v1/attendances/me', () => {
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockRecords.slice(0, 1) })
  }),

  http.post('/api/v1/attendances/check-in', () => {
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        id: Date.now(),
        memberId: 1,
        memberName: '김리더',
        workDate: new Date().toISOString().slice(0, 10),
        checkInTime: new Date().toISOString(),
        checkOutTime: null,
        status: 'WORKING',
      },
    })
  }),

  http.post('/api/v1/attendances/check-out', () => {
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        id: Date.now(),
        memberId: 1,
        memberName: '김리더',
        workDate: new Date().toISOString().slice(0, 10),
        checkInTime: new Date().toISOString(),
        checkOutTime: new Date().toISOString(),
        status: 'LEFT',
      },
    })
  }),
]
