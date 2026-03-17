import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider } from '../AppContext'
import { EventsProvider, useEvents } from '../EventsContext'

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

  describe('초기 상태', () => {
    it('초기 이벤트 목록은 비어 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      expect(result.current.events).toHaveLength(0)
    })
  })

  describe('addEvent', () => {
    it('이벤트를 추가할 수 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent())
      })
      expect(result.current.events).toHaveLength(1)
    })

    it('추가한 이벤트에 id가 자동 생성된다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent())
      })
      expect(result.current.events[0].id).toBeTruthy()
    })

    it('추가한 이벤트에 createdBy가 현재 사용자 ID로 설정된다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent())
      })
      expect(result.current.events[0].createdBy).toBe('1')
    })

    it('이벤트 추가 시 localStorage에 저장된다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: '저장 확인' }))
      })
      const stored = localStorage.getItem('yanus-events')
      expect(stored).toContain('저장 확인')
    })
  })

  describe('updateEvent', () => {
    it('이벤트 제목을 수정할 수 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ title: '원래 제목' }))
      })
      const id = result.current.events[0].id
      act(() => {
        result.current.updateEvent(id, { title: '수정된 제목' })
      })
      expect(result.current.events[0].title).toBe('수정된 제목')
    })
  })

  describe('deleteEvent', () => {
    it('이벤트를 삭제할 수 있다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent())
      })
      const id = result.current.events[0].id
      act(() => {
        result.current.deleteEvent(id)
      })
      expect(result.current.events).toHaveLength(0)
    })
  })

  describe('getEventsByDate', () => {
    it('특정 날짜의 이벤트를 반환한다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ startDate: '2025-06-01', endDate: '2025-06-01' }))
        result.current.addEvent(makeEvent({ startDate: '2025-06-02', endDate: '2025-06-02' }))
      })
      const events = result.current.getEventsByDate('2025-06-01')
      expect(events).toHaveLength(1)
    })

    it('여러 날에 걸친 이벤트도 날짜 범위 내에서 반환한다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ startDate: '2025-06-01', endDate: '2025-06-03' }))
      })
      expect(result.current.getEventsByDate('2025-06-02')).toHaveLength(1)
    })
  })

  describe('getEventsForDateRange', () => {
    it('날짜 범위 내의 이벤트를 반환한다', () => {
      const { result } = renderHook(() => useEvents(), { wrapper })
      act(() => {
        result.current.addEvent(makeEvent({ startDate: '2025-06-01', endDate: '2025-06-01' }))
        result.current.addEvent(makeEvent({ startDate: '2025-06-10', endDate: '2025-06-10' }))
        result.current.addEvent(makeEvent({ startDate: '2025-07-01', endDate: '2025-07-01' }))
      })
      const events = result.current.getEventsForDateRange('2025-06-01', '2025-06-30')
      expect(events).toHaveLength(2)
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
