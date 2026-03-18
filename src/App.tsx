import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { TasksProvider } from './context/TasksContext'
import { EventsProvider } from './context/EventsContext'
import { ChatProvider } from './context/ChatContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Chat } from './pages/Chat'
import { Calendar } from './pages/Calendar'
import { Attendance } from './pages/Attendance'
import { Drive } from './pages/Drive'
import { AIChat } from './pages/AIChat'
import { Members } from './pages/Members'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp()
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isLoggedIn } = useApp()
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
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
  )
}

function App() {
  return (
    <AppProvider>
      <TasksProvider>
        <EventsProvider>
        <ChatProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        </ChatProvider>
        </EventsProvider>
      </TasksProvider>
    </AppProvider>
  )
}

export default App
