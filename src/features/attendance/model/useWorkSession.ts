import { useState, useEffect } from 'react'
import type { WorkStatus } from '../ui/AnimatedClockRing'
import { clockIn as apiClockIn, clockOut as apiClockOut, getMyAttendance } from '../../../shared/api/attendanceApi'

const STORAGE_KEY = 'yanus-work-session'

export function useWorkSession() {
  const [status, setStatus] = useState<WorkStatus>('idle')
  const [clockIn, setClockIn] = useState<Date | null>(null)
  const [clockOut, setClockOut] = useState<Date | null>(null)

  // 서버 출퇴근 기록으로 초기 상태 동기화
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    getMyAttendance()
      .then((records) => {
        const todayRecord = records.find((r) => r.workDate === todayStr)
        if (todayRecord) {
          if (todayRecord.status === 'LEFT') {
            setStatus('done')
            setClockIn(todayRecord.checkInTime ? new Date(todayRecord.checkInTime) : null)
            setClockOut(todayRecord.checkOutTime ? new Date(todayRecord.checkOutTime) : null)
          } else if (todayRecord.status === 'WORKING') {
            setStatus('working')
            setClockIn(todayRecord.checkInTime ? new Date(todayRecord.checkInTime) : null)
            setClockOut(null)
          }
        } else {
          // 서버 기록 없으면 localStorage fallback
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as { status: WorkStatus; clockIn?: string; clockOut?: string }
              setStatus(parsed.status)
              setClockIn(parsed.clockIn ? new Date(parsed.clockIn) : null)
              setClockOut(parsed.clockOut ? new Date(parsed.clockOut) : null)
            } catch {}
          }
        }
      })
      .catch(() => {
        // 서버 오류 시 localStorage fallback
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { status: WorkStatus; clockIn?: string; clockOut?: string }
            setStatus(parsed.status)
            setClockIn(parsed.clockIn ? new Date(parsed.clockIn) : null)
            setClockOut(parsed.clockOut ? new Date(parsed.clockOut) : null)
          } catch {}
        }
      })
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
      apiClockIn().catch(() => {})
    } else if (status === 'working') {
      setClockOut(new Date())
      setStatus('done')
      apiClockOut().catch(() => {})
    } else {
      setClockIn(null)
      setClockOut(null)
      setStatus('idle')
    }
  }

  return { status, clockIn, clockOut, handleClockClick }
}
