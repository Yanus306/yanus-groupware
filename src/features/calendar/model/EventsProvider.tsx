import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { CalendarEvent } from '../../../entities/event/model/types'
import {
  getEvents as apiGetEvents,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
  type ApiEvent,
  type CreateEventPayload,
} from '../../../shared/api/calendarApi'
import { getTodayStr } from '../../../shared/lib/date'
import { useApp } from '../../auth/model/AppProvider'

export type { CalendarEvent } from '../../../entities/event/model/types'

type EventsContextValue = {
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdBy'>) => void
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdBy'>>) => void
  deleteEvent: (id: string) => void
  getEventsByDate: (date: string) => CalendarEvent[]
  getEventsForDateRange: (start: string, end: string) => CalendarEvent[]
}

const EventsContext = createContext<EventsContextValue | null>(null)

// ApiEvent → CalendarEvent 변환 (HH:mm:ss → HH:mm 슬라이싱, id number → string)
function toCalendarEvent(e: ApiEvent): CalendarEvent {
  return {
    id: String(e.id),
    title: e.title,
    startDate: e.startDate,
    startTime: e.startTime.slice(0, 5),
    endDate: e.endDate,
    endTime: e.endTime.slice(0, 5),
    createdBy: e.createdByName,
  }
}

// CalendarEvent 시간 → API 포맷 (HH:mm → HH:mm:00)
function toApiTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = getTodayStr()
  const [year] = today.split('-').map(Number)
  return {
    startDate: `${year - 1}-01-01`,
    endDate: `${year + 1}-12-31`,
  }
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!state.currentUser?.id) {
      setEvents([])
      return
    }

    const { startDate, endDate } = getDefaultDateRange()
    apiGetEvents(startDate, endDate)
      .then((data) => setEvents(data.map(toCalendarEvent)))
      .catch(() => {})
  }, [state.currentUser?.id])

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, 'id' | 'createdBy'>) => {
      const optimisticId = `optimistic-${Date.now()}`
      const optimistic: CalendarEvent = { ...event, id: optimisticId, createdBy: '' }
      setEvents((prev) => [...prev, optimistic])

      const payload: CreateEventPayload = {
        title: event.title,
        startDate: event.startDate,
        startTime: toApiTime(event.startTime),
        endDate: event.endDate,
        endTime: toApiTime(event.endTime),
      }
      apiCreateEvent(payload)
        .then((serverEvent) =>
          setEvents((prev) =>
            prev.map((e) => (e.id === optimisticId ? toCalendarEvent(serverEvent) : e)),
          ),
        )
        .catch(() => setEvents((prev) => prev.filter((e) => e.id !== optimisticId)))
    },
    [],
  )

  const updateEvent = useCallback(
    (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdBy'>>) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
      const apiUpdates: Partial<CreateEventPayload> = {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.startDate !== undefined && { startDate: updates.startDate }),
        ...(updates.startTime !== undefined && { startTime: toApiTime(updates.startTime) }),
        ...(updates.endDate !== undefined && { endDate: updates.endDate }),
        ...(updates.endTime !== undefined && { endTime: toApiTime(updates.endTime) }),
      }
      apiUpdateEvent(Number(id), apiUpdates).catch(() => {})
    },
    [],
  )

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    apiDeleteEvent(Number(id)).catch(() => {})
  }, [])

  const getEventsByDate = useCallback(
    (date: string) => events.filter((e) => e.startDate <= date && date <= e.endDate),
    [events],
  )

  const getEventsForDateRange = useCallback(
    (start: string, end: string) => events.filter((e) => e.startDate <= end && e.endDate >= start),
    [events],
  )

  return (
    <EventsContext.Provider
      value={{ events, addEvent, updateEvent, deleteEvent, getEventsByDate, getEventsForDateRange }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEvents must be used within EventsProvider')
  return ctx
}
