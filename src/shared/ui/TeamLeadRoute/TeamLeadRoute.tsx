import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../../features/auth/model'
import { canAccessTeamManagement } from '../../lib/permissions'

export function TeamLeadRoute() {
  const { state } = useApp()
  return canAccessTeamManagement(state.currentUser) ? <Outlet /> : <Navigate to="/" replace />
}
