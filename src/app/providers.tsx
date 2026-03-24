import type { ReactNode } from 'react'
import { AppProvider } from '../features/auth/model'
import { TasksProvider } from '../features/tasks/model'
import { EventsProvider } from '../features/calendar/model'
import { ChatProvider } from '../features/chat/model'
import { ThemeProvider } from '../shared/theme'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppProvider>
        <TasksProvider>
          <EventsProvider>
            <ChatProvider>{children}</ChatProvider>
          </EventsProvider>
        </TasksProvider>
      </AppProvider>
    </ThemeProvider>
  )
}
