import { baseClient } from './baseClient'

export type ApiTaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ApiTask {
  id: number
  title: string
  date: string         // YYYY-MM-DD
  time: string         // HH:mm:ss
  priority: ApiTaskPriority
  done: boolean
  isTeamTask: boolean
  assigneeId: number | null
  assigneeName: string | null
}

export interface CreateTaskPayload {
  title: string
  date: string
  time: string
  priority: ApiTaskPriority
  isTeamTask: boolean
  assigneeId?: number | null
}

export interface GetTasksParams {
  type?: 'MY' | 'TEAM'
  startDate?: string
  endDate?: string
}

export const getTasks = (params?: GetTasksParams) => {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  const qs = query.toString()
  return baseClient.get<ApiTask[]>(`/api/v1/tasks${qs ? `?${qs}` : ''}`)
}

export const createTask = (body: CreateTaskPayload) =>
  baseClient.post<ApiTask>('/api/v1/tasks', body)

export const updateTask = (id: number, body: Partial<Omit<CreateTaskPayload, 'isTeamTask'>>) =>
  baseClient.put<ApiTask>(`/api/v1/tasks/${id}`, body)

export const toggleTaskDone = (id: number) =>
  baseClient.patch<ApiTask>(`/api/v1/tasks/${id}/done`, {})

export const deleteTask = (id: number) =>
  baseClient.delete<null>(`/api/v1/tasks/${id}`)
