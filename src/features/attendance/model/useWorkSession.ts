import { useState, useEffect } from 'react'
import type { WorkStatus } from '../ui/AnimatedClockRing'
import { clockIn as apiClockIn, clockOut as apiClockOut, getMyAttendance } from '../../../shared/api/attendanceApi'
import { ApiError } from '../../../shared/api/baseClient'

const STORAGE_KEY = 'yanus-work-session'

export function useWorkSession() {
  const [status, setStatus] = useState<WorkStatus>('idle')
  const [clockIn, setClockIn] = useState<Date | null>(null)
  const [clockOut, setClockOut] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      // 낙관적 업데이트
      const now = new Date()
      setClockIn(now)
      setClockOut(null)
      setStatus('working')
      try {
        const record = await apiClockIn()
        // 서버 실제 시각으로 보정
        if (record.checkInTime) setClockIn(new Date(record.checkInTime))
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'ATT_001') {
            // 이미 출근 처리됨 — 조용히 서버 기록으로 시각 보정 (에러 아님)
            getMyAttendance().then((records) => {
              const today = new Date().toISOString().slice(0, 10)
              const rec = records.find((r) => r.workDate === today)
              if (rec) setClockIn(rec.checkInTime ? new Date(rec.checkInTime) : now)
            }).catch(() => {})
            // status는 'working' 유지
          } else {
            // 기타 에러 — 낙관적 업데이트 롤백
            setStatus('idle')
            setClockIn(null)
            setErrorMessage(err.message)
          }
        } else {
          setStatus('idle')
          setClockIn(null)
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
          if (err.code === 'ATT_003') {
            // 이미 퇴근 처리됨 — 조용히 done 유지 (에러 아님)
          } else if (err.code === 'ATT_002') {
            // 출근 기록 없음 — idle로 복구
            setStatus('idle')
            setClockIn(null)
            setClockOut(null)
            setErrorMessage(err.message)
          } else if (err.code === 'ATT_004') {
            // 퇴근 시각이 출근 시각 이전
            setStatus('working')
            setClockOut(null)
            setErrorMessage(err.message)
          } else {
            setStatus('working')
            setClockOut(null)
            setErrorMessage(err.message)
          }
        } else {
          setStatus('working')
          setClockOut(null)
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

  return { status, clockIn, clockOut, handleClockClick, errorMessage, clearError }
}
