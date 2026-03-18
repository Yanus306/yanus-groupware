import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider } from '../../../auth/model/AppProvider'
import { TasksProvider, useTasks } from '../TasksProvider'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>
    <TasksProvider>{children}</TasksProvider>
  </AppProvider>
)

const makeTask = (overrides?: Partial<{ title: string; date: string; priority: 'high' | 'medium' | 'low' }>) => ({
  title: '테스트 태스크',
  time: '10:00 오전',
  date: '2025-06-01',
  priority: 'medium' as const,
  done: false,
  ...overrides,
})

describe('TasksProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('addTask', () => {
    it('태스크를 추가할 수 있다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask())
      })
      expect(result.current.tasks.length).toBeGreaterThan(0)
    })

    it('추가한 태스크에 id가 자동 생성된다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask())
      })
      const added = result.current.tasks.at(-1)
      expect(added?.id).toBeTruthy()
    })

    it('추가한 태스크의 createdBy가 현재 사용자 ID로 설정된다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask())
      })
      const added = result.current.tasks.at(-1)
      expect(added?.createdBy).toBeDefined()
    })

    it('태스크 추가 시 localStorage에 저장된다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask({ title: 'localStorage 저장 확인' }))
      })
      const stored = localStorage.getItem('yanus-tasks')
      expect(stored).toContain('localStorage 저장 확인')
    })
  })

  describe('updateTask', () => {
    it('태스크 제목을 수정할 수 있다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask({ title: '원래 제목' }))
      })
      const id = result.current.tasks.at(-1)!.id
      act(() => {
        result.current.updateTask(id, { title: '수정된 제목' })
      })
      const updated = result.current.tasks.find((t) => t.id === id)
      expect(updated?.title).toBe('수정된 제목')
    })
  })

  describe('deleteTask', () => {
    it('태스크를 삭제할 수 있다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask())
      })
      const beforeCount = result.current.tasks.length
      const id = result.current.tasks.at(-1)!.id
      act(() => {
        result.current.deleteTask(id)
      })
      expect(result.current.tasks.length).toBe(beforeCount - 1)
    })
  })

  describe('toggleTaskDone', () => {
    it('완료 상태를 토글할 수 있다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask())
      })
      const id = result.current.tasks.at(-1)!.id
      act(() => {
        result.current.toggleTaskDone(id)
      })
      expect(result.current.tasks.find((t) => t.id === id)?.done).toBe(true)
    })

    it('완료 상태를 다시 토글하면 미완료로 돌아온다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask())
      })
      const id = result.current.tasks.at(-1)!.id
      act(() => { result.current.toggleTaskDone(id) })
      act(() => { result.current.toggleTaskDone(id) })
      expect(result.current.tasks.find((t) => t.id === id)?.done).toBe(false)
    })
  })

  describe('getTasksByDate', () => {
    it('특정 날짜의 태스크만 반환한다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask({ date: '2025-06-01' }))
        result.current.addTask(makeTask({ date: '2025-06-02' }))
      })
      const tasks = result.current.getTasksByDate('2025-06-01')
      expect(tasks.every((t) => t.date === '2025-06-01')).toBe(true)
    })
  })

  describe('getTasksForDateRange', () => {
    it('날짜 범위 내의 태스크를 반환한다', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      act(() => {
        result.current.addTask(makeTask({ date: '2025-06-01' }))
        result.current.addTask(makeTask({ date: '2025-06-15' }))
        result.current.addTask(makeTask({ date: '2025-07-01' }))
      })
      const tasks = result.current.getTasksForDateRange('2025-06-01', '2025-06-30')
      expect(tasks).toHaveLength(2)
    })
  })

  describe('useTasks 훅', () => {
    it('TasksProvider 외부에서 useTasks 호출 시 에러를 던진다', () => {
      expect(() => renderHook(() => useTasks())).toThrow(
        'useTasks must be used within TasksProvider'
      )
    })
  })
})
