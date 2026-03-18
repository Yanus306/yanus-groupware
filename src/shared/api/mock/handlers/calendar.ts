import { http, HttpResponse } from 'msw'

let mockEvents = [
  { id: 'e1', title: '팀 주간 회의', startDate: '2026-03-18', startTime: '10:00', endDate: '2026-03-18', endTime: '11:00', createdBy: '1' },
  { id: 'e2', title: '디자인 리뷰', startDate: '2026-03-19', startTime: '14:00', endDate: '2026-03-19', endTime: '15:00', createdBy: '2' },
  { id: 'e3', title: '스프린트 계획', startDate: '2026-03-23', startTime: '09:00', endDate: '2026-03-23', endTime: '10:30', createdBy: '1' },
]

export const calendarHandlers = [
  http.get('/events', () => {
    return HttpResponse.json(mockEvents)
  }),

  http.post('/events', async ({ request }) => {
    const body = await request.json() as { title: string; startDate: string; startTime: string; endDate: string; endTime: string }
    const newEvent = { ...body, id: `e${Date.now()}`, createdBy: '1' }
    mockEvents = [...mockEvents, newEvent]
    return HttpResponse.json(newEvent, { status: 201 })
  }),

  http.put('/events/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof mockEvents[0]>
    mockEvents = mockEvents.map((e) => e.id === params.id ? { ...e, ...body } : e)
    const updated = mockEvents.find((e) => e.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.delete('/events/:id', ({ params }) => {
    mockEvents = mockEvents.filter((e) => e.id !== params.id)
    return HttpResponse.json({ success: true })
  }),
]
