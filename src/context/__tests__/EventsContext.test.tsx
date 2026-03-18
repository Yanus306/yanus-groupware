import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { setupServer } from 'msw/node'
import { calendarHandlers } from '../../shared/api/mock/handlers/calendar'
import { AppProvider } from '../AppContext'
import { EventsProvider, useEvents } from '../EventsContext'

const server = setupServer(...calendarHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>
    <EventsProvider>{children}</EventsProvider>
  </AppProvider>
)

const makeEvent = (overrides?: Partial<{ title: string; startDate: string; endDate: string }>) => ({
  title: '테스트 이벤트',
  startDate: '2025-06-01',
  startTime: '10:00',
  endDate: '2025-06-01',
  endTime: '11:00',
  ...overrides,
})

describe('EventsContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('addEvent', () => {
    it('이벤트를 추가할 수 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      const before = result.current.events.length
      act(() => {
        result.current.addEvent(makeEvent())
      })
      expect(result.current.events.length).toBe(before + 1)
    })

    it('추가한 이벤트에 id가 자동 생성된다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent())
      })
      const added = result.current.events.find((e) => e.title === '테스트 이벤트')
      expect(added?.id).toBeTruthy()
    })

    it('추가한 이벤트에 createdBy가 자동 설정된다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent())
      })
      const added = result.current.events.find((e) => e.title === '테스트 이벤트')
      expect(added?.createdBy).toBeDefined()
    })

    it('이벤트 추가 시 목록에 반영된다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      const before = result.current.events.length
      act(() => {
        result.current.addEvent(makeEvent({ title: '새 이벤트' }))
      })
      expect(result.current.events.length).toBe(before + 1)
    })
  })

  describe('updateEvent', () => {
    it('이벤트 제목을 수정할 수 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: '원래 제목' }))
      })
      const id = result.current.events.find((e) => e.title === '원래 제목')!.id
      act(() => {
        result.current.updateEvent(id, { title: '수정된 제목' })
      })
      expect(result.current.events.find((e) => e.id === id)?.title).toBe('수정된 제목')
    })
  })

  describe('deleteEvent', () => {
    it('이벤트를 삭제할 수 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: '삭제 대상' }))
      })
      const id = result.current.events.find((e) => e.title === '삭제 대상')!.id
      act(() => {
        result.current.deleteEvent(id)
      })
      expect(result.current.events.find((e) => e.id === id)).toBeUndefined()
    })
  })

  describe('getEventsByDate', () => {
    it('특정 날짜의 이벤트를 반환한다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: 'A', startDate: '2025-06-01', endDate: '2025-06-01' }))
        result.current.addEvent(makeEvent({ title: 'B', startDate: '2025-06-02', endDate: '2025-06-02' }))
      })
      const events = result.current.getEventsByDate('2025-06-01')
      expect(events.some((e) => e.title === 'A')).toBe(true)
      expect(events.every((e) => e.startDate <= '2025-06-01' && '2025-06-01' <= e.endDate)).toBe(true)
    })

    it('여러 날에 걸친 이벤트도 날짜 범위 내에서 반환한다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: 'multi', startDate: '2025-06-01', endDate: '2025-06-03' }))
      })
      expect(result.current.getEventsByDate('2025-06-02').some((e) => e.title === 'multi')).toBe(true)
    })
  })

  describe('getEventsForDateRange', () => {
    it('날짜 범위 내의 이벤트를 반환한다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: 'Jun1', startDate: '2025-06-01', endDate: '2025-06-01' }))
        result.current.addEvent(makeEvent({ title: 'Jun10', startDate: '2025-06-10', endDate: '2025-06-10' }))
        result.current.addEvent(makeEvent({ title: 'Jul1', startDate: '2025-07-01', endDate: '2025-07-01' }))
      })
      const events = result.current.getEventsForDateRange('2025-06-01', '2025-06-30')
      expect(events.some((e) => e.title === 'Jun1')).toBe(true)
      expect(events.some((e) => e.title === 'Jun10')).toBe(true)
      expect(events.some((e) => e.title === 'Jul1')).toBe(false)
    })
  })

  describe('useEvents 훅', () => {
    it('EventsProvider 외부에서 useEvents 호출 시 에러를 던진다', () => {
      expect(() => renderHook(() => useEvents())).toThrow(
        'useEvents must be used within EventsProvider'
      )
    })
  })
})
