import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { CalendarEvent } from '../../../entities/event/model/types'

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

const STORAGE_KEY = 'yanus-events'

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return (Array.isArray(parsed) ? parsed : []).map((e: unknown) => {
      const ev = e as Record<string, unknown>
      if (ev.startDate && ev.endDate) return ev as unknown as CalendarEvent
      if (ev.date) {
        return { ...ev, startDate: ev.date, endDate: ev.date } as unknown as CalendarEvent
      }
      return ev as unknown as CalendarEvent
    })
  } catch {}
  return []
}

function saveEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {}
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents)

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id' | 'createdBy'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}`,
      createdBy: state.currentUser?.id ?? '',
    }
    setEvents((prev) => {
      const next = [...prev, newEvent]
      saveEvents(next)
      return next
    })
  }, [state.currentUser?.id])

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      saveEvents(next)
      return next
    })
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveEvents(next)
      return next
    })
  }, [])

  const getEventsByDate = useCallback((date: string) => {
    return events.filter((e) => e.startDate <= date && date <= e.endDate)
  }, [events])

  const getEventsForDateRange = useCallback((start: string, end: string) => {
    return events.filter((e) => e.startDate <= end && e.endDate >= start)
  }, [events])

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsByDate,
        getEventsForDateRange,
      }}
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
