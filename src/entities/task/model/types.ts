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
  createdBy: string
}
