import { useState, useEffect } from 'react'
import type { WorkStatus } from '../ui/AnimatedClockRing'

const STORAGE_KEY = 'yanus-work-session'

export function useWorkSession() {
  const [status, setStatus] = useState<WorkStatus>('idle')
  const [clockIn, setClockIn] = useState<Date | null>(null)
  const [clockOut, setClockOut] = useState<Date | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { status: WorkStatus; clockIn?: string; clockOut?: string }
        setStatus(parsed.status)
        setClockIn(parsed.clockIn ? new Date(parsed.clockIn) : null)
        setClockOut(parsed.clockOut ? new Date(parsed.clockOut) : null)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const payload = {
      status,
      clockIn: clockIn?.toISOString(),
      clockOut: clockOut?.toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [status, clockIn, clockOut])

  const handleClockClick = () => {
    if (status === 'idle') {
      setClockIn(new Date())
      setClockOut(null)
      setStatus('working')
    } else if (status === 'working') {
      setClockOut(new Date())
      setStatus('done')
    } else {
      setClockIn(null)
      setClockOut(null)
      setStatus('idle')
    }
  }

  return { status, clockIn, clockOut, handleClockClick }
}
