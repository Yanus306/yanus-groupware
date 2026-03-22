import { baseClient } from './baseClient'

export interface ApiEvent {
  id: number
  title: string
  startDate: string   // YYYY-MM-DD
  startTime: string   // HH:mm:ss
  endDate: string     // YYYY-MM-DD
  endTime: string     // HH:mm:ss
  createdById: number
  createdByName: string
}

export type CreateEventPayload = Omit<ApiEvent, 'id' | 'createdById' | 'createdByName'>

export const getEvents = (startDate: string, endDate: string) =>
  baseClient.get<ApiEvent[]>(`/api/v1/events?startDate=${startDate}&endDate=${endDate}`)

export const getMyEvents = () =>
  baseClient.get<ApiEvent[]>('/api/v1/events/me')

export const createEvent = (body: CreateEventPayload) =>
  baseClient.post<ApiEvent>('/api/v1/events', body)

export const updateEvent = (id: number, body: Partial<CreateEventPayload>) =>
  baseClient.put<ApiEvent>(`/api/v1/events/${id}`, body)

export const deleteEvent = (id: number) =>
  baseClient.delete<null>(`/api/v1/events/${id}`)
