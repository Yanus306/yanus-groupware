import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { CalendarEvent } from '../../../entities/event/model/types'
import {
  getEvents as apiGetEvents,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
} from '../../../shared/api/calendarApi'

export type { CalendarEvent } from '../../../entities/event/model/types'

type EventsContextValue = {
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdBy'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  getEventsByDate: (date: string) => CalendarEvent[]
  getEventsForDateRange: (start: string, end: string) => CalendarEvent[]
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    apiGetEvents()
      .then((data) => setEvents(data as CalendarEvent[]))
      .catch(() => {})
  }, [])

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, 'id' | 'createdBy'>) => {
      const optimistic: CalendarEvent = {
        ...event,
        id: `event-${Date.now()}`,
        createdBy: state.currentUser?.id ?? '',
      }
      setEvents((prev) => [...prev, optimistic])
      apiCreateEvent(event)
        .then((serverEvent) =>
          setEvents((prev) =>
            prev.map((e) => (e.id === optimistic.id ? (serverEvent as CalendarEvent) : e))
          )
        )
        .catch(() => {})
    },
    [state.currentUser?.id]
  )

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
    apiUpdateEvent(id, updates).catch(() => {})
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    apiDeleteEvent(id).catch(() => {})
  }, [])

  const getEventsByDate = useCallback(
    (date: string) => events.filter((e) => e.startDate <= date && date <= e.endDate),
    [events]
  )

  const getEventsForDateRange = useCallback(
    (start: string, end: string) => events.filter((e) => e.startDate <= end && e.endDate >= start),
    [events]
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
