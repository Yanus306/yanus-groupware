import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useApp } from './AppContext'

export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  time: string
  date: string // YYYY-MM-DD
  priority: TaskPriority
  done: boolean
  assigneeId?: string
  assigneeName?: string
  createdBy: string // current user id
}

type TasksContextValue = {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdBy'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskDone: (id: string) => void
  getTasksByDate: (date: string) => Task[]
  getTasksForDateRange: (start: string, end: string) => Task[]
}

const TasksContext = createContext<TasksContextValue | null>(null)

const STORAGE_KEY = 'yanus-tasks'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateDisplay(dateStr: string, baseDate: Date): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (taskDay.getTime() === today.getTime()) return '오늘'
  if (taskDay.getTime() === tomorrow.getTime()) return '내일'
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${days[d.getDay()]}요일, ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {}
}

const initialTasks: Task[] = [
  { id: '1', title: '이벤트 계획 확정', time: '11:00 오전', date: '2024-02-26', priority: 'high', done: false, createdBy: '1' },
  { id: '2', title: '예산 제안서 검토', time: '3:00 오후', date: '2024-02-26', priority: 'medium', done: false, assigneeId: '1', assigneeName: '팀 리드', createdBy: '1' },
  { id: '3', title: '뉴스레터 발송', time: '9:30 오전', date: '2024-02-26', priority: 'low', done: true, createdBy: '1' },
  { id: '4', title: '발표 자료 준비', time: '10:00 오전', date: '2024-02-27', priority: 'high', done: false, createdBy: '1' },
  { id: '5', title: '팀 미팅', time: '2:00 오후', date: '2024-02-27', priority: 'high', done: false, createdBy: '1' },
  { id: '6', title: '업체 후속 연락', time: '4:00 오후', date: '2024-02-28', priority: 'low', done: false, createdBy: '1' },
]

export function TasksProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = loadTasks()
    return stored.length > 0 ? stored : initialTasks
  })

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdBy'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdBy: state.currentUser.id,
    }
    setTasks((prev) => {
      const next = [...prev, newTask]
      saveTasks(next)
      return next
    })
  }, [state.currentUser.id])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      saveTasks(next)
      return next
    })
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id)
      saveTasks(next)
      return next
    })
  }, [])

  const toggleTaskDone = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      saveTasks(next)
      return next
    })
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
        addTask,
        updateTask,
        deleteTask,
        toggleTaskDone,
        getTasksByDate,
        getTasksForDateRange,
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

export { formatDateDisplay, getTodayStr }
