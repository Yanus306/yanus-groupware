import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { Task, TaskPriority } from '../../../entities/task/model/types'
import {
  getTasks as apiGetTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  toggleTaskDone as apiToggleTaskDone,
} from '../../../shared/api/tasksApi'
import type { ApiTask, ApiTaskPriority } from '../../../shared/api/tasksApi'

export type { Task, TaskPriority } from '../../../entities/task/model/types'
export { getTodayStr, formatDateDisplay } from '../../../shared/lib/date'

type TasksContextValue = {
  tasks: Task[]
  myTasks: Task[]
  teamTasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdBy'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskDone: (id: string) => Promise<void>
  getTasksByDate: (date: string) => Task[]
  getTasksForDateRange: (start: string, end: string) => Task[]
  isLoading: boolean
}

const TasksContext = createContext<TasksContextValue | null>(null)

const PRIORITY_TO_API: Record<TaskPriority, ApiTaskPriority> = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}

const PRIORITY_FROM_API: Record<ApiTaskPriority, TaskPriority> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

/** "HH:mm:ss" → "H:mm 오전/오후" */
function apiTimeToDisplay(t: string): string {
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return t
  const period = h >= 12 ? '오후' : '오전'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** "H:mm 오전/오후" → "HH:mm:00" */
function displayTimeToApi(t: string): string {
  const parts = t.trim().split(' ')
  const [timePart, period] = parts.length >= 2 ? [parts[0], parts[1]] : [parts[0], '']
  const [h12str, mStr] = timePart.split(':')
  const h12 = Number(h12str)
  const m = Number(mStr) || 0
  if (isNaN(h12)) return '00:00:00'
  let h24: number
  if (period === '오전') h24 = h12 === 12 ? 0 : h12
  else if (period === '오후') h24 = h12 === 12 ? 12 : h12 + 12
  else h24 = h12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function toTask(api: ApiTask): Task {
  return {
    id: String(api.id),
    title: api.title,
    time: apiTimeToDisplay(api.time),
    date: api.date,
    priority: PRIORITY_FROM_API[api.priority] ?? 'medium',
    done: api.done,
    isTeamTask: api.isTeamTask,
    assigneeId: api.assigneeId != null ? String(api.assigneeId) : undefined,
    assigneeName: api.assigneeName ?? undefined,
    createdBy: api.assigneeId != null ? String(api.assigneeId) : '',
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    apiGetTasks()
      .then((apiTasks) => setTasks(apiTasks.map(toTask)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const myTasks = useMemo(() => tasks.filter((t) => !t.isTeamTask), [tasks])
  const teamTasks = useMemo(() => tasks.filter((t) => t.isTeamTask), [tasks])

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdBy'>) => {
    const apiTask = await apiCreateTask({
      title: task.title,
      date: task.date,
      time: displayTimeToApi(task.time),
      priority: PRIORITY_TO_API[task.priority] ?? 'MEDIUM',
      isTeamTask: task.isTeamTask,
      assigneeId: task.assigneeId ? Number(task.assigneeId) : null,
    })
    setTasks((prev) => [...prev, toTask(apiTask)])
  }, [state.currentUser?.id])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const apiUpdates: Parameters<typeof apiUpdateTask>[1] = {}
    if (updates.title !== undefined) apiUpdates.title = updates.title
    if (updates.date !== undefined) apiUpdates.date = updates.date
    if (updates.time !== undefined) apiUpdates.time = displayTimeToApi(updates.time)
    if (updates.priority !== undefined) apiUpdates.priority = PRIORITY_TO_API[updates.priority]
    const apiTask = await apiUpdateTask(Number(id), apiUpdates)
    setTasks((prev) => prev.map((t) => (t.id === id ? toTask(apiTask) : t)))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    await apiDeleteTask(Number(id))
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleTaskDone = useCallback(async (id: string) => {
    const apiTask = await apiToggleTaskDone(Number(id))
    setTasks((prev) => prev.map((t) => (t.id === id ? toTask(apiTask) : t)))
  }, [])

  const getTasksByDate = useCallback((date: string) => {
    return tasks.filter((t) => t.date === date)
  }, [tasks])

  const getTasksForDateRange = useCallback((start: string, end: string) => {
    return tasks.filter((t) => t.date >= start && t.date <= end)
  }, [tasks])

  return (
    <TasksContext.Provider
      value={{
        tasks,
        myTasks,
        teamTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskDone,
        getTasksByDate,
        getTasksForDateRange,
        isLoading,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used within TasksProvider')
  return ctx
}
