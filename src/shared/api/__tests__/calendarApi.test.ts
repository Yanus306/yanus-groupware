import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { calendarHandlers } from '../mock/handlers/calendar'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../calendarApi'

const server = setupServer(...calendarHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('calendarApi', () => {
  it('getEvents() 이벤트 목록을 반환한다', async () => {
    const events = await getEvents()
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]).toHaveProperty('title')
    expect(events[0]).toHaveProperty('startDate')
  })

  it('createEvent() 새 이벤트를 생성하고 반환한다', async () => {
    const event = await createEvent({
      title: '테스트 회의',
      startDate: '2026-03-20',
      startTime: '10:00',
      endDate: '2026-03-20',
      endTime: '11:00',
    })
    expect(event).toHaveProperty('id')
    expect(event.title).toBe('테스트 회의')
  })

  it('updateEvent() 이벤트를 수정하고 반환한다', async () => {
    const updated = await updateEvent('e1', { title: '수정된 회의' })
    expect(updated.title).toBe('수정된 회의')
  })

  it('deleteEvent() 이벤트를 삭제하고 success를 반환한다', async () => {
    const result = await deleteEvent('e1')
    expect(result).toEqual({ success: true })
  })
})
