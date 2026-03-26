import { useEffect, useRef, type ReactNode } from 'react'
import { AppProvider } from '../features/auth/model'
import { useApp } from '../features/auth/model'
import { TasksProvider } from '../features/tasks/model'
import { useTasks } from '../features/tasks/model'
import { EventsProvider } from '../features/calendar/model'
import { useEvents } from '../features/calendar/model'
import { ChatProvider } from '../features/chat/model'
import { useChat } from '../features/chat/model'
import { ThemeProvider } from '../shared/theme'

function AppPreloadGate({ children }: { children: ReactNode }) {
  const { state, refreshMembers, refreshTeams, setBootstrapping } = useApp()
  const { refreshTasks } = useTasks()
  const { refreshEvents } = useEvents()
  const { refreshChannels } = useChat()
  const bootstrappedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const currentUserId = state.currentUser?.id ?? null

    if (!currentUserId) {
      bootstrappedUserIdRef.current = null
      setBootstrapping(false)
      return
    }

    if (bootstrappedUserIdRef.current === currentUserId) {
      return
    }

    let cancelled = false
    setBootstrapping(true)

    Promise.all([
      refreshMembers(),
      refreshTeams(),
      refreshTasks(),
      refreshEvents(),
      refreshChannels(),
    ])
      .catch(() => {})
      .finally(() => {
        if (cancelled) return
        bootstrappedUserIdRef.current = currentUserId
        setBootstrapping(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshChannels, refreshEvents, refreshMembers, refreshTasks, refreshTeams, setBootstrapping, state.currentUser?.id])

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppProvider>
        <TasksProvider>
          <EventsProvider>
            <ChatProvider>
              <AppPreloadGate>{children}</AppPreloadGate>
            </ChatProvider>
          </EventsProvider>
        </TasksProvider>
      </AppProvider>
    </ThemeProvider>
  )
}
