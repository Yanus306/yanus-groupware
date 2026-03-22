import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../../features/auth/model'

export function PrivateRoute() {
  const { isInitializing } = useApp()
  const isLoggedIn = !!localStorage.getItem('accessToken')

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary, #111118)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-purple, #9680cc)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />
}
