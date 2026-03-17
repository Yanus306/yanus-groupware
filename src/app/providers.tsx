import type { ReactNode } from 'react'
import { AppProvider } from '../features/auth/model'
import { TasksProvider } from '../features/tasks/model'
import { EventsProvider } from '../features/calendar/model'
import { ChatProvider } from '../features/chat/model'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <TasksProvider>
        <EventsProvider>
          <ChatProvider>{children}</ChatProvider>
        </EventsProvider>
      </TasksProvider>
    </AppProvider>
  )
}
