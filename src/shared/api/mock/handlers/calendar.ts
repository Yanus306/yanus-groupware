import { http, HttpResponse } from 'msw'

interface MockEvent {
  id: number
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  createdById: number
  createdByName: string
}

let nextId = 4
let mockEvents: MockEvent[] = [
  { id: 1, title: '팀 주간 회의', startDate: '2026-03-18', startTime: '10:00:00', endDate: '2026-03-18', endTime: '11:00:00', createdById: 1, createdByName: '김리더' },
  { id: 2, title: '디자인 리뷰', startDate: '2026-03-19', startTime: '14:00:00', endDate: '2026-03-19', endTime: '15:00:00', createdById: 2, createdByName: '박팀장' },
  { id: 3, title: '스프린트 계획', startDate: '2026-03-23', startTime: '09:00:00', endDate: '2026-03-23', endTime: '10:30:00', createdById: 1, createdByName: '김리더' },
]

const ok = <T>(data: T) => HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })

export const calendarHandlers = [
  http.get('/api/v1/events', ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const filtered = startDate && endDate
      ? mockEvents.filter((e) => e.startDate >= startDate && e.startDate <= endDate)
      : mockEvents
    return ok(filtered)
  }),

  http.get('/api/v1/events/me', () => {
    return ok(mockEvents.filter((e) => e.createdById === 1))
  }),

  http.post('/api/v1/events', async ({ request }) => {
    const body = await request.json() as Omit<MockEvent, 'id' | 'createdById' | 'createdByName'>
    const newEvent: MockEvent = { ...body, id: nextId++, createdById: 1, createdByName: '김리더' }
    mockEvents = [...mockEvents, newEvent]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: newEvent }, { status: 201 })
  }),

  http.put('/api/v1/events/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as Partial<MockEvent>
    mockEvents = mockEvents.map((e) => e.id === id ? { ...e, ...body } : e)
    const updated = mockEvents.find((e) => e.id === id)
    return ok(updated)
  }),

  http.delete('/api/v1/events/:id', ({ params }) => {
    const id = Number(params.id)
    mockEvents = mockEvents.filter((e) => e.id !== id)
    return ok(null)
  }),
]
