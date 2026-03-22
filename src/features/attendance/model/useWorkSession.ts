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

  // 서버 출퇴근 기록으로 초기 상태 동기화
  useEffect(() => {
    const todayStr = getTodayStr()
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
      const now = new Date()
      setClockIn(now)
      setClockOut(null)
      setStatus('working')
      try {
        const record = await apiClockIn()
        if (record.checkInTime) setClockIn(new Date(record.checkInTime))
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'ALREADY_CHECKED_IN') {
            // 이미 출근 처리됨 — 서버 기록으로 시각 보정, info 안내
            setToastType('info')
            setErrorMessage('이미 출근 처리된 기록이 있습니다')
            getMyAttendance().then((records) => {
              const rec = records.find((r) => r.workDate === getTodayStr())
              if (rec) setClockIn(rec.checkInTime ? new Date(rec.checkInTime) : now)
            }).catch(() => {})
          } else {
            setStatus('idle')
            setClockIn(null)
            setToastType('error')
            setErrorMessage(err.message)
          }
        } else {
          setStatus('idle')
          setClockIn(null)
          setToastType('error')
          setErrorMessage('출근 처리에 실패했습니다')
        }
      }
    } else if (status === 'working') {
      const now = new Date()
      setClockOut(now)
      setStatus('done')
      try {
        const record = await apiClockOut()
        if (record.checkOutTime) setClockOut(new Date(record.checkOutTime))
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'ALREADY_CHECKED_OUT') {
            // 이미 퇴근 처리됨 — info 안내
            setToastType('info')
            setErrorMessage('이미 퇴근 처리된 기록이 있습니다')
          } else if (err.code === 'NOT_CHECKED_IN') {
            setStatus('idle')
            setClockIn(null)
            setClockOut(null)
            setToastType('error')
            setErrorMessage(err.message)
          } else if (err.code === 'INVALID_CHECKOUT_TIME') {
            setStatus('working')
            setClockOut(null)
            setToastType('error')
            setErrorMessage(err.message)
          } else {
            setStatus('working')
            setClockOut(null)
            setToastType('error')
            setErrorMessage(err.message)
          }
        } else {
          setStatus('working')
          setClockOut(null)
          setToastType('error')
          setErrorMessage('퇴근 처리에 실패했습니다')
        }
      }
    } else {
      setClockIn(null)
      setClockOut(null)
      setStatus('idle')
    }
  }

  const clearError = () => setErrorMessage(null)

  return { status, clockIn, clockOut, handleClockClick, errorMessage, toastType, clearError }
}
