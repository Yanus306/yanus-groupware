import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { AppProvider, useApp } from '../../../auth/model/AppProvider'
import { TasksProvider, useTasks } from '../TasksProvider'

let nextId = 100
const TASKS: ReturnType<typeof makeApiTask>[] = []

function makeApiTask(overrides: Partial<{
  title: string
  date: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  done: boolean
  isTeamTask: boolean
  assigneeId: number | null
}> = {}) {
  return {
    id: nextId++,
    title: '테스트 태스크',
    date: '2025-06-01',
    time: '10:00:00',
    priority: 'MEDIUM' as const,
    done: false,
    isTeamTask: false,
    assigneeId: null,
    assigneeName: null,
    ...overrides,
  }
}

const server = setupServer(
  http.get('/api/v1/tasks', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const filtered = type === 'TEAM'
      ? TASKS.filter((t) => t.isTeamTask)
      : TASKS.filter((t) => !t.isTeamTask)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),
  http.post('/api/v1/tasks', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const task = makeApiTask({
      title: body.title as string,
      priority: body.priority as 'HIGH' | 'MEDIUM' | 'LOW',
      isTeamTask: body.isTeamTask as boolean,
      assigneeId: body.assigneeId as number | null,
    })
    TASKS.push(task)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: task }, { status: 201 })
  }),
  http.put('/api/v1/tasks/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    const idx = TASKS.findIndex((t) => String(t.id) === params.id)
    if (idx >= 0) Object.assign(TASKS[idx], body)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: idx >= 0 ? TASKS[idx] : null })
  }),
  http.patch('/api/v1/tasks/:id/done', ({ params }) => {
    const idx = TASKS.findIndex((t) => String(t.id) === params.id)
    if (idx >= 0) TASKS[idx].done = !TASKS[idx].done
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: idx >= 0 ? TASKS[idx] : null })
  }),
  http.delete('/api/v1/tasks/:id', ({ params }) => {
    const idx = TASKS.findIndex((t) => String(t.id) === params.id)
    if (idx >= 0) TASKS.splice(idx, 1)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
)

beforeAll(() => server.listen())
afterEach(() => { server.resetHandlers(); TASKS.length = 0; nextId = 100 })
afterAll(() => server.close())

function AuthBootstrap({ children }: { children: ReactNode }) {
  const { loadUser } = useApp()

  useEffect(() => {
    loadUser({
      id: '1',
      name: '김리더',
      email: 'leader@test.com',
      role: 'ADMIN',
      team: '1팀',
      status: 'ACTIVE',
    })
  }, [loadUser])

  return <>{children}</>
}

function TasksBootstrap({ children }: { children: ReactNode }) {
  const { refreshTasks } = useTasks()

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  return <>{children}</>
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>
    <AuthBootstrap>
      <TasksProvider>
        <TasksBootstrap>{children}</TasksBootstrap>
      </TasksProvider>
    </AuthBootstrap>
  </AppProvider>
)

async function mountHook() {
  const hook = renderHook(() => useTasks(), { wrapper })
  await act(async () => {})
  return hook
}

describe('TasksProvider', () => {
  describe('초기 로드', () => {
    it('마운트 시 API에서 태스크 목록을 불러온다', async () => {
      TASKS.push(makeApiTask({ title: '서버 태스크' }))
      const { result } = await mountHook()
      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].title).toBe('서버 태스크')
    })

    it('API 응답의 isTeamTask 값을 Task에 올바르게 매핑한다', async () => {
      TASKS.push(makeApiTask({ isTeamTask: false }))
      TASKS.push(makeApiTask({ isTeamTask: true }))
      const { result } = await mountHook()
      expect(result.current.tasks[0].isTeamTask).toBe(false)
      expect(result.current.tasks[1].isTeamTask).toBe(true)
    })
  })

  describe('addTask', () => {
    it('태스크를 추가할 수 있다', async () => {
      const { result } = await mountHook()
      await act(async () => {
        await result.current.addTask({ title: '새 태스크', time: '10:00 오전', date: '2025-06-01', priority: 'medium', done: false, isTeamTask: false })
      })
      expect(result.current.tasks.length).toBeGreaterThan(0)
      expect(result.current.tasks.at(-1)?.title).toBe('새 태스크')
    })

    it('추가한 태스크에 id가 자동 생성된다', async () => {
      const { result } = await mountHook()
      await act(async () => {
        await result.current.addTask({ title: '새 태스크', time: '10:00 오전', date: '2025-06-01', priority: 'medium', done: false, isTeamTask: false })
      })
      expect(result.current.tasks.at(-1)?.id).toBeTruthy()
    })

    it('API에 전송하는 time은 HH:mm:ss 형식이다', async () => {
      let capturedTime: string | undefined
      server.use(
        http.post('/api/v1/tasks', async ({ request }) => {
          const body = await request.json() as Record<string, string>
          capturedTime = body.time
          const task = makeApiTask({ title: body.title as string })
          TASKS.push(task)
          return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: task }, { status: 201 })
        }),
      )
      const { result } = await mountHook()
      await act(async () => {
        await result.current.addTask({ title: 'time 형식 테스트', time: '1:30 오후', date: '2025-06-01', priority: 'medium', done: false, isTeamTask: false })
      })
      expect(capturedTime).toBe('13:30:00')
    })

    it('API에서 받은 time(HH:mm:ss)은 표시 형식(오전/오후)으로 변환된다', async () => {
      TASKS.push({ ...makeApiTask(), time: '14:00:00' })
      const { result } = await mountHook()
      expect(result.current.tasks[0].time).toBe('2:00 오후')
    })

    it('내 할일 추가 시 isTeamTask: false로 API 호출된다', async () => {
      let capturedIsTeamTask: boolean | undefined
      server.use(
        http.post('/api/v1/tasks', async ({ request }) => {
          const body = await request.json() as Record<string, unknown>
          capturedIsTeamTask = body.isTeamTask as boolean
          const task = makeApiTask()
          TASKS.push(task)
          return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: task }, { status: 201 })
        }),
      )
      const { result } = await mountHook()
      await act(async () => {
        await result.current.addTask({ title: '내 할일', time: '10:00 오전', date: '2025-06-01', priority: 'medium', done: false, isTeamTask: false })
      })
      expect(capturedIsTeamTask).toBe(false)
    })

    it('팀 할일 추가 시 isTeamTask: true로 API 호출된다', async () => {
      let capturedIsTeamTask: boolean | undefined
      server.use(
        http.post('/api/v1/tasks', async ({ request }) => {
          const body = await request.json() as Record<string, unknown>
          capturedIsTeamTask = body.isTeamTask as boolean
          const task = makeApiTask({ isTeamTask: true })
          TASKS.push(task)
          return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: task }, { status: 201 })
        }),
      )
      const { result } = await mountHook()
      await act(async () => {
        await result.current.addTask({ title: '팀 할일', time: '10:00 오전', date: '2025-06-01', priority: 'medium', done: false, isTeamTask: true })
      })
      expect(capturedIsTeamTask).toBe(true)
    })

    it('내 할일(isTeamTask: false)은 myTasks에만 포함된다', async () => {
      TASKS.push(makeApiTask({ isTeamTask: false }))
      TASKS.push(makeApiTask({ isTeamTask: true }))
      const { result } = await mountHook()
      expect(result.current.myTasks).toHaveLength(1)
      expect(result.current.myTasks[0].isTeamTask).toBe(false)
    })

    it('팀 할일(isTeamTask: true)은 teamTasks에만 포함된다', async () => {
      TASKS.push(makeApiTask({ isTeamTask: false }))
      TASKS.push(makeApiTask({ isTeamTask: true }))
      const { result } = await mountHook()
      expect(result.current.teamTasks).toHaveLength(1)
      expect(result.current.teamTasks[0].isTeamTask).toBe(true)
    })
  })

  describe('updateTask', () => {
    it('태스크 제목을 수정할 수 있다', async () => {
      TASKS.push(makeApiTask({ title: '원래 제목' }))
      const { result } = await mountHook()
      const id = result.current.tasks[0].id
      await act(async () => {
        await result.current.updateTask(id, { title: '수정된 제목' })
      })
      expect(result.current.tasks.find((t) => t.id === id)?.title).toBe('수정된 제목')
    })
  })

  describe('deleteTask', () => {
    it('태스크를 삭제할 수 있다', async () => {
      TASKS.push(makeApiTask())
      const { result } = await mountHook()
      const beforeCount = result.current.tasks.length
      const id = result.current.tasks[0].id
      await act(async () => {
        await result.current.deleteTask(id)
      })
      expect(result.current.tasks.length).toBe(beforeCount - 1)
    })
  })

  describe('toggleTaskDone', () => {
    it('완료 상태를 토글할 수 있다', async () => {
      TASKS.push(makeApiTask({ done: false }))
      const { result } = await mountHook()
      const id = result.current.tasks[0].id
      await act(async () => {
        await result.current.toggleTaskDone(id)
      })
      expect(result.current.tasks.find((t) => t.id === id)?.done).toBe(true)
    })
  })

  describe('getTasksByDate', () => {
    it('특정 날짜의 태스크만 반환한다', async () => {
      TASKS.push(makeApiTask({ date: '2025-06-01' } as never))
      TASKS.push(makeApiTask({ date: '2025-06-02' } as never))
      const { result } = await mountHook()
      const tasks = result.current.getTasksByDate('2025-06-01')
      expect(tasks.every((t) => t.date === '2025-06-01')).toBe(true)
    })
  })

  describe('getTasksForDateRange', () => {
    it('날짜 범위 내의 태스크를 반환한다', async () => {
      TASKS.push(makeApiTask({ date: '2025-06-01' } as never))
      TASKS.push(makeApiTask({ date: '2025-06-15' } as never))
      TASKS.push(makeApiTask({ date: '2025-07-01' } as never))
      const { result } = await mountHook()
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
