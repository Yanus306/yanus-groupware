import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../widgets/Layout'
import { PrivateRoute } from '../shared/ui/PrivateRoute'
import { AdminRoute } from '../shared/ui/AdminRoute'
import { Login } from '../pages/login'
import { Register } from '../pages/register'
import { Dashboard } from '../pages/dashboard'
import { Chat } from '../pages/chat'
import { Calendar } from '../pages/calendar'
import { Attendance } from '../pages/attendance'
import { Drive } from '../pages/drive'
import { AIChat } from '../pages/ai-chat'
import { Members } from '../pages/members'
import { Settings } from '../pages/settings'
import { Admin } from '../pages/admin'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute />}>
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
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
