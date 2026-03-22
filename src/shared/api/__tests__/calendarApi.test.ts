import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../calendarApi'

const mockEvent = {
  id: 1,
  title: '팀 주간 회의',
  startDate: '2026-03-25',
  startTime: '09:00:00',
  endDate: '2026-03-25',
  endTime: '10:00:00',
  createdById: 1,
  createdByName: '정용태',
}

const server = setupServer(
  http.get('/api/v1/events', ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    if (!startDate || !endDate) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: '날짜 범위가 필요합니다', data: null },
        { status: 400 },
      )
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [mockEvent] })
  }),

  http.post('/api/v1/events', async ({ request }) => {
    const body = await request.json() as typeof mockEvent
    return HttpResponse.json(
      { code: 'SUCCESS', message: 'ok', data: { ...body, id: 99, createdById: 1, createdByName: '정용태' } },
      { status: 201 },
    )
  }),

  http.put('/api/v1/events/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<typeof mockEvent>
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { ...mockEvent, ...body, id: Number(params.id) },
    })
  }),

  http.delete('/api/v1/events/:id', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('calendarApi', () => {
  it('getEvents() 날짜 범위로 이벤트 목록을 반환한다', async () => {
    const events = await getEvents('2026-03-01', '2026-03-31')
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]).toHaveProperty('title')
    expect(events[0]).toHaveProperty('startDate')
    expect(events[0]).toHaveProperty('createdById')
  })

  it('getEvents() 날짜 파라미터 없이 호출하면 에러를 던진다', async () => {
    server.use(
      http.get('/api/v1/events', () =>
        HttpResponse.json(
          { code: 'BAD_REQUEST', message: '날짜 범위가 필요합니다', data: null },
          { status: 400 },
        ),
      ),
    )
    await expect(getEvents('', '')).rejects.toThrow()
  })

  it('createEvent() 새 이벤트를 생성하고 반환한다', async () => {
    const event = await createEvent({
      title: '테스트 회의',
      startDate: '2026-03-25',
      startTime: '09:00:00',
      endDate: '2026-03-25',
      endTime: '10:00:00',
    })
    expect(event).toHaveProperty('id')
    expect(event.title).toBe('테스트 회의')
    expect(event).toHaveProperty('createdById')
  })

  it('updateEvent() 이벤트를 수정하고 반환한다', async () => {
    const updated = await updateEvent(1, { title: '수정된 회의' })
    expect(updated.title).toBe('수정된 회의')
  })

  it('deleteEvent() 이벤트를 삭제하면 null을 반환한다', async () => {
    const result = await deleteEvent(1)
    expect(result).toBeNull()
  })
})
