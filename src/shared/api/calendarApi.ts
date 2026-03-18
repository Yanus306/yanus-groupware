import { baseClient } from './baseClient'

export interface ApiEvent {
  id: string
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  createdBy?: string
}

export const getEvents = () => baseClient.get<ApiEvent[]>('/events')

export const createEvent = (body: Omit<ApiEvent, 'id' | 'createdBy'>) =>
  baseClient.post<ApiEvent>('/events', body)

export const updateEvent = (id: string, body: Partial<ApiEvent>) =>
  baseClient.put<ApiEvent>(`/events/${id}`, body)

export const deleteEvent = (id: string) =>
  baseClient.delete<{ success: boolean }>(`/events/${id}`)
