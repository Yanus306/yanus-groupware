import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../../features/auth/model'

export function TeamLeadRoute() {
  const { isTeamLead } = useApp()
  return isTeamLead ? <Outlet /> : <Navigate to="/" replace />
}
