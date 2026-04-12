import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../widgets/Layout'
import { PrivateRoute } from '../shared/ui/PrivateRoute'
import { AdminRoute } from '../shared/ui/AdminRoute'
import { TeamLeadRoute } from '../shared/ui/TeamLeadRoute'
import { Login } from '../pages/login'
import { Register } from '../pages/register'
import { VerifyEmail } from '../pages/verify-email'
import { Dashboard } from '../pages/dashboard'
import { Chat } from '../pages/chat'
import { Calendar } from '../pages/calendar'
import { Attendance } from '../pages/attendance'
import { WorkSchedules } from '../pages/work-schedules'
import { Drive } from '../pages/drive'
import { AIChat } from '../pages/ai-chat'
import { Members } from '../pages/members'
import { Settings } from '../pages/settings'
import { Admin } from '../pages/admin'
import { TeamManagement } from '../pages/team-management'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="tasks" element={<Navigate to="/calendar" replace />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="work-schedules" element={<WorkSchedules />} />
            <Route path="drive" element={<Drive />} />
            <Route path="ai" element={<AIChat />} />
            <Route path="members" element={<Members />} />
            <Route path="my-page" element={<Settings />} />
            <Route path="settings" element={<Navigate to="/my-page" replace />} />
            <Route element={<TeamLeadRoute />}>
              <Route path="team-management" element={<TeamManagement />} />
            </Route>
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
