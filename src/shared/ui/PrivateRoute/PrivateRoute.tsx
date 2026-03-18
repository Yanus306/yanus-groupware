import { Navigate, Outlet } from 'react-router-dom'

export function PrivateRoute() {
  const isLoggedIn = !!localStorage.getItem('accessToken')
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />
}
