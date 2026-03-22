import { useState, useEffect } from 'react'
import type { WorkStatus } from '../ui/AnimatedClockRing'
import { clockIn as apiClockIn, clockOut as apiClockOut, getMyAttendance } from '../../../shared/api/attendanceApi'
import { ApiError } from '../../../shared/api/baseClient'
import { getTodayStr } from '../../../shared/lib/date'

const STORAGE_KEY = 'yanus-work-session'

export function useWorkSession() {
  const [status, setStatus] = useState<WorkStatus>('idle')
  const [clockIn, setClockIn] = useState<Date | null>(null)
  const [clockOut, setClockOut] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'error' | 'info'>('error')
  const [isLoading, setIsLoading] = useState(true)

  // 서버 출퇴근 기록으로 초기 상태 동기화
  useEffect(() => {
    const todayStr = getTodayStr()
    getMyAttendance(todayStr)
      .then((records) => {
        const todayRecord = records[0]
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
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status,
      clockIn: clockIn?.toISOString(),
      clockOut: clockOut?.toISOString(),
    }))
  }, [status, clockIn, clockOut])

  const handleClockClick = async () => {
    setErrorMessage(null)

    if (status === 'idle') {
      setIsLoading(true)
      try {
        const record = await apiClockIn()
        setClockIn(record.checkInTime ? new Date(record.checkInTime) : new Date())
        setClockOut(null)
        setStatus('working')
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'ALREADY_CHECKED_IN') {
            // 이미 출근 처리됨 — 서버 기록으로 동기화 후 working 전환
            setToastType('info')
            setErrorMessage('이미 출근 처리된 기록이 있습니다')
            getMyAttendance(getTodayStr()).then((records) => {
              const rec = records[0]
              if (rec) {
                setClockIn(rec.checkInTime ? new Date(rec.checkInTime) : new Date())
                setStatus('working')
              }
            }).catch(() => {})
          } else {
            setToastType('error')
            setErrorMessage(err.message)
          }
        } else {
          setToastType('error')
          setErrorMessage('출근 처리에 실패했습니다')
        }
      } finally {
        setIsLoading(false)
      }
    } else if (status === 'working') {
      setIsLoading(true)
      try {
        const record = await apiClockOut()
        setClockOut(record.checkOutTime ? new Date(record.checkOutTime) : new Date())
        setStatus('done')
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'ALREADY_CHECKED_OUT') {
            // 이미 퇴근 처리됨 — done으로 동기화
            setToastType('info')
            setErrorMessage('이미 퇴근 처리된 기록이 있습니다')
            setStatus('done')
          } else if (err.code === 'NOT_CHECKED_IN') {
            setStatus('idle')
            setClockIn(null)
            setClockOut(null)
            setToastType('error')
            setErrorMessage(err.message)
          } else {
            setToastType('error')
            setErrorMessage(err.message)
          }
        } else {
          setToastType('error')
          setErrorMessage('퇴근 처리에 실패했습니다')
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      setClockIn(null)
      setClockOut(null)
      setStatus('idle')
    }
  }

  const clearError = () => setErrorMessage(null)

  return { status, clockIn, clockOut, handleClockClick, errorMessage, toastType, clearError, isLoading }
}
