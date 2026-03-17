import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './features/auth/model'
import { TasksProvider } from './features/tasks/model'
import { EventsProvider } from './features/calendar/model'
import { ChatProvider } from './features/chat/model'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Chat } from './pages/Chat'
import { Calendar } from './pages/Calendar'
import { Attendance } from './pages/Attendance'
import { Drive } from './pages/Drive'
import { AIChat } from './pages/AIChat'
import { Members } from './pages/Members'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AppProvider>
      <TasksProvider>
        <EventsProvider>
        <ChatProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="tasks" element={<Navigate to="/calendar" replace />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="drive" element={<Drive />} />
            <Route path="ai" element={<AIChat />} />
            <Route path="members" element={<Members />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ChatProvider>
        </EventsProvider>
      </TasksProvider>
    </AppProvider>
  )
}

export default App
