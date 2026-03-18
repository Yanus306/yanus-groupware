import { http, HttpResponse } from 'msw'

const mockRecords = [
  { id: '1', userId: '1', userName: '김리더', date: '2026-03-18', clockIn: '09:02', clockOut: '18:15', status: 'done' },
  { id: '2', userId: '2', userName: '박팀장', date: '2026-03-18', clockIn: '09:45', clockOut: '18:30', status: 'done' },
  { id: '3', userId: '3', userName: '이멤버', date: '2026-03-18', clockIn: '-', clockOut: '-', status: 'absent' },
  { id: '4', userId: '1', userName: '김리더', date: '2026-03-17', clockIn: '09:10', clockOut: '18:00', status: 'done' },
  { id: '5', userId: '2', userName: '박팀장', date: '2026-03-17', clockIn: '09:00', clockOut: '18:00', status: 'done' },
  { id: '6', userId: '1', userName: '김리더', date: '2026-03-16', clockIn: '08:55', clockOut: '17:50', status: 'done' },
]

export const attendanceHandlers = [
  http.get('/attendance', () => {
    return HttpResponse.json(mockRecords)
  }),

  http.post('/attendance/clock-in', () => {
    return HttpResponse.json({
      id: `rec-${Date.now()}`,
      clockIn: new Date().toTimeString().slice(0, 5),
      date: new Date().toISOString().slice(0, 10),
      status: 'working',
    })
  }),

  http.post('/attendance/clock-out', () => {
    return HttpResponse.json({
      clockOut: new Date().toTimeString().slice(0, 5),
      status: 'done',
    })
  }),
]
