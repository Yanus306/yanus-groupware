import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../../features/auth/model'

export function AdminRoute() {
  const { isAdmin } = useApp()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}
