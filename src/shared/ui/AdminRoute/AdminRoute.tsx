import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../../features/auth/model'
import { canAccessAdmin } from '../../lib/permissions'

export function AdminRoute() {
  const { state } = useApp()
  return canAccessAdmin(state.currentUser) ? <Outlet /> : <Navigate to="/" replace />
}
