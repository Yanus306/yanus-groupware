import { useState, useEffect, useRef, useCallback } from 'react'
import type { WorkStatus } from '../ui/AnimatedClockRing'
import { clockIn as apiClockIn, clockOut as apiClockOut, getMyAttendance, resetMyAttendance } from '../../../shared/api/attendanceApi'
import { ApiError } from '../../../shared/api/baseClient'
import { getTodayStr } from '../../../shared/lib/date'
import { useApp } from '../../auth/model/AppProvider'
import { ATTENDANCE_STORAGE_KEYS, getUserAttendanceStorageKey } from '../../../shared/lib/attendanceStorage'

interface StoredWorkSession {
  status: WorkStatus
  clockIn?: string
  clockOut?: string
}

function readStoredSession(storageKey: string | null): StoredWorkSession | null {
  if (!storageKey) return null
  const stored = localStorage.getItem(storageKey)
  if (!stored) return null

  try {
    return JSON.parse(stored) as StoredWorkSession
  } catch {
    return null
  }
}

function isSameWorkday(value: string | undefined, todayStr: string) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && getTodayStr(date) === todayStr
}

function canRestoreStoredSession(session: StoredWorkSession | null, todayStr: string) {
  if (!session) return false

  return isSameWorkday(session.clockIn, todayStr) || isSameWorkday(session.clockOut, todayStr)
}

export function useWorkSession() {
  const { state } = useApp()
  const storageKey = getUserAttendanceStorageKey(
    ATTENDANCE_STORAGE_KEYS.session,
    state.currentUser?.id,
  )
  const [status, setStatus] = useState<WorkStatus>('idle')
  const [clockIn, setClockIn] = useState<Date | null>(null)
  const [clockOut, setClockOut] = useState<Date | null>(null)
  const [attendanceDate, setAttendanceDate] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'error' | 'info'>('error')
  const [isLoading, setIsLoading] = useState(true)
  const actionInFlightRef = useRef(false)

  const syncTodayAttendance = useCallback(async () => {
    const todayStr = getTodayStr()
    const records = await getMyAttendance()
    const todayRecord = records.find((record) => record.workDate === todayStr)

    if (!todayRecord) {
      setStatus('idle')
      setClockIn(null)
      setClockOut(null)
      setAttendanceDate(null)
      return null
    }

    if (todayRecord.status === 'LEFT') {
      setStatus('done')
      setClockIn(todayRecord.checkInTime ? new Date(todayRecord.checkInTime) : null)
      setClockOut(todayRecord.checkOutTime ? new Date(todayRecord.checkOutTime) : null)
      setAttendanceDate(todayRecord.workDate)
      return todayRecord
    }

    setStatus('working')
    setClockIn(todayRecord.checkInTime ? new Date(todayRecord.checkInTime) : null)
    setClockOut(null)
    setAttendanceDate(todayRecord.workDate)
    return todayRecord
  }, [])

  const isAttendanceIpError = (error: ApiError) =>
    error.code.toUpperCase().includes('IP') ||
    /220\.69|아이피|IP/.test(error.message)

  const syncStoredState = useCallback(async () => {
    setErrorMessage(null)
    if (!storageKey) {
      setIsLoading(false)
      return
    }

    const todayStr = getTodayStr()
    try {
      const todayRecord = await syncTodayAttendance()
      if (!todayRecord) localStorage.removeItem(storageKey)
    } catch (err) {
      const stored = readStoredSession(storageKey)
      if (canRestoreStoredSession(stored, todayStr) && stored) {
        setStatus(stored.status)
        setClockIn(stored.clockIn ? new Date(stored.clockIn) : null)
        setClockOut(stored.clockOut ? new Date(stored.clockOut) : null)
      } else {
        localStorage.removeItem(storageKey)
      }
      setToastType('error')
      setErrorMessage(err instanceof ApiError ? err.message : '출퇴근 상태를 불러오지 못했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [storageKey, syncTodayAttendance])

  // 서버 출퇴근 기록으로 초기 상태 동기화
  useEffect(() => {
    setStatus('idle')
    setClockIn(null)
    setClockOut(null)
    setAttendanceDate(null)
    void syncStoredState()
  }, [storageKey, syncStoredState])

  useEffect(() => {
    if (isLoading) return

    if (status === 'idle' && !clockIn && !clockOut) {
      if (storageKey) localStorage.removeItem(storageKey)
      return
    }

    if (!storageKey) return
    localStorage.setItem(storageKey, JSON.stringify({
      status,
      clockIn: clockIn?.toISOString(),
      clockOut: clockOut?.toISOString(),
    }))
  }, [status, clockIn, clockOut, isLoading, storageKey])

  const handleClockClick = async () => {
    if (actionInFlightRef.current) return
    actionInFlightRef.current = true
    setErrorMessage(null)

    try {
      if (status === 'idle') {
        setIsLoading(true)
        try {
          const record = await apiClockIn()
          setClockIn(record.checkInTime ? new Date(record.checkInTime) : new Date())
          setClockOut(null)
          setAttendanceDate(record.workDate)
          setStatus('working')
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.code === 'ALREADY_CHECKED_IN') {
              // 이미 출근 처리됨 — 서버 기록으로 동기화 후 working 전환
              setToastType('info')
              setErrorMessage('이미 출근 처리된 기록이 있습니다')
              syncTodayAttendance().catch(() => {
                setStatus('working')
                setToastType('info')
                setErrorMessage('출근 상태를 동기화하지 못했습니다')
              })
            } else if (isAttendanceIpError(err)) {
              setToastType('error')
              setErrorMessage('출근은 220.69 대역 IP에서만 가능합니다')
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
          setAttendanceDate(record.workDate)
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
              setAttendanceDate(null)
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
      } else if (status === 'done') {
        setIsLoading(true)
        try {
          await resetMyAttendance(attendanceDate ?? getTodayStr())
          setToastType('info')
          setErrorMessage('오늘 출근 기록을 초기화했습니다')
          setClockIn(null)
          setClockOut(null)
          setAttendanceDate(null)
          setStatus('idle')
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.code === 'NOT_CHECKED_IN' || err.code === 'ATTENDANCE_NOT_FOUND') {
              setToastType('info')
              setErrorMessage('초기화할 출근 기록이 없습니다')
              setClockIn(null)
              setClockOut(null)
              setAttendanceDate(null)
              setStatus('idle')
            } else {
              setToastType('error')
              setErrorMessage(err.message)
            }
          } else {
            setToastType('error')
            setErrorMessage('출근 기록 초기화에 실패했습니다')
          }
        } finally {
          setIsLoading(false)
        }
      }
    } finally {
      actionInFlightRef.current = false
    }
  }

  const clearError = () => setErrorMessage(null)

  return { status, clockIn, clockOut, handleClockClick, retry: syncStoredState, errorMessage, toastType, clearError, isLoading }
}
