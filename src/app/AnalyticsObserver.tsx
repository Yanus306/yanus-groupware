import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../features/auth/model'
import { capturePageview, initializeAnalytics, syncAnalyticsUser } from '../shared/lib/analytics'

export function AnalyticsObserver() {
  const { pathname } = useLocation()
  const { state, isInitializing } = useApp()
  const previousPath = useRef<string | null>(null)
  const userId = state.currentUser?.id ?? null

  useEffect(() => {
    if (isInitializing || !initializeAnalytics()) return
    syncAnalyticsUser(userId)
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    capturePageview()
  }, [isInitializing, pathname, userId])

  return null
}
