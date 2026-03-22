import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskDone } from '../tasksApi'

const MOCK_TASK = {
  id: 1,
  title: '테스트 태스크',
  date: '2026-03-25',
  time: '14:00:00',
  priority: 'HIGH' as const,
  done: false,
  isTeamTask: false,
  assigneeId: 1,
  assigneeName: '정용태',
}

const server = setupServer(
  http.get('/api/v1/tasks', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [MOCK_TASK] }),
  ),
  http.post('/api/v1/tasks', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(
      { code: 'SUCCESS', message: 'ok', data: { ...MOCK_TASK, ...body, id: 2 } },
      { status: 201 },
    )
  }),
  http.put('/api/v1/tasks/:id', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { ...MOCK_TASK, ...body } })
  }),
  http.patch('/api/v1/tasks/:id/done', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { ...MOCK_TASK, done: true } }),
  ),
  http.delete('/api/v1/tasks/:id', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('tasksApi', () => {
  it('getTasks() 태스크 목록을 반환한다', async () => {
    const tasks = await getTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({ id: 1, title: '테스트 태스크', priority: 'HIGH' })
  })

  it('createTask() 새 태스크를 생성하고 반환한다', async () => {
    const task = await createTask({ title: '새 태스크', date: '2026-03-25', time: '14:00:00', priority: 'HIGH', isTeamTask: false })
    expect(task).toMatchObject({ title: '새 태스크', priority: 'HIGH' })
    expect(task.id).toBeTruthy()
  })

  it('updateTask() 태스크를 수정하고 반환한다', async () => {
    const updated = await updateTask(1, { title: '수정된 태스크' })
    expect(updated.title).toBe('수정된 태스크')
  })

  it('toggleTaskDone() 태스크 완료 상태를 토글하고 반환한다', async () => {
    const toggled = await toggleTaskDone(1)
    expect(toggled.done).toBe(true)
  })

  it('deleteTask() 태스크를 삭제하고 null을 반환한다', async () => {
    const result = await deleteTask(1)
    expect(result).toBeNull()
  })
})
