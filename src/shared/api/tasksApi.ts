import { baseClient } from './baseClient'

export type ApiTaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

// TaskResponse (OpenAPI 스펙 기준) — createdById 없음
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
  memberIds?: number[] | null    // 추가 참여 멤버 ID 목록
  memberNames?: string[] | null  // 추가 참여 멤버 이름 목록
}

export interface CreateTaskPayload {
  title: string
  date: string
  time: string
  priority: ApiTaskPriority
  isTeamTask: boolean
  assigneeId?: number | null
  memberIds?: number[]  // 추가 참여 멤버 ID 목록
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

// TaskUpdateRequest (OpenAPI 스펙 기준) — assigneeId 없음, memberIds만 포함
export interface UpdateTaskPayload {
  title?: string
  date?: string
  time?: string
  priority?: ApiTaskPriority
  memberIds?: number[]
}
export const updateTask = (id: number, body: UpdateTaskPayload) =>
  baseClient.put<ApiTask>(`/api/v1/tasks/${id}`, body)

export const toggleTaskDone = (id: number) =>
  baseClient.patch<ApiTask>(`/api/v1/tasks/${id}/done`, {})

export const deleteTask = (id: number) =>
  baseClient.delete<null>(`/api/v1/tasks/${id}`)
