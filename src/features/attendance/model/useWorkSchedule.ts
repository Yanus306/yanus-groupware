import { useState, useEffect } from 'react'
import { getMyWorkSchedule, upsertWorkScheduleDay } from '../../../shared/api/attendanceApi'
import type { DayOfWeek } from '../../../shared/api/attendanceApi'
import { ApiError } from '../../../shared/api/baseClient'

export interface DaySchedule {
  checkInTime: string   // "HH:mm"
  checkOutTime: string  // "HH:mm"
}

// 배열 인덱스 ↔ DayOfWeek 매핑 (0=Mon, 1=Tue, ..., 6=Sun)
const INDEX_TO_DOW: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
]

const WORK_DAYS_STORAGE_KEY = 'yanus-work-days'
const DEFAULT_CHECK_IN = '09:00'
const DEFAULT_CHECK_OUT = '18:00'
const DEFAULT_WORK_DAYS = [true, true, true, true, true, false, false]

function makeDefaultDaySchedules(checkIn: string, checkOut: string): DaySchedule[] {
  return Array.from({ length: 7 }, () => ({ checkInTime: checkIn, checkOutTime: checkOut }))
}

export function useWorkSchedule() {
  const [workDays, setWorkDays] = useState<boolean[]>(DEFAULT_WORK_DAYS)
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
    makeDefaultDaySchedules(DEFAULT_CHECK_IN, DEFAULT_CHECK_OUT),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // localStorage에서 근무 요일 토글 상태 복원
    const storedDays = localStorage.getItem(WORK_DAYS_STORAGE_KEY)
    if (storedDays) {
      try {
        const parsed = JSON.parse(storedDays) as boolean[]
        if (Array.isArray(parsed) && parsed.length === 7) setWorkDays(parsed)
      } catch {}
    }

    // API에서 요일별 근무 시간 불러오기
    getMyWorkSchedule()
      .then((items) => {
        if (items.length === 0) return
        setDaySchedules((prev) => {
          const next = [...prev]
          for (const item of items) {
            const idx = INDEX_TO_DOW.indexOf(item.dayOfWeek)
            if (idx >= 0) {
              next[idx] = {
                checkInTime: item.startTime.slice(0, 5),
                checkOutTime: item.endTime.slice(0, 5),
              }
            }
          }
          return next
        })
        // localStorage에 저장된 토글 없으면 API 응답 기반으로 활성 요일 설정
        if (!storedDays) {
          const activeDays = INDEX_TO_DOW.map((dow) =>
            items.some((item) => item.dayOfWeek === dow),
          )
          if (activeDays.some(Boolean)) setWorkDays(activeDays)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const toggleDay = (index: number) => {
    setWorkDays((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  const setDayTime = (index: number, field: 'checkInTime' | 'checkOutTime', value: string) => {
    setDaySchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const saveSchedule = async () => {
    setIsSaving(true)
    setError(null)
    try {
      // 활성화된 요일만 API에 upsert
      const promises = workDays
        .map((active, i) => {
          if (!active) return null
          return upsertWorkScheduleDay({
            dayOfWeek: INDEX_TO_DOW[i],
            startTime: daySchedules[i].checkInTime + ':00',
            endTime: daySchedules[i].checkOutTime + ':00',
          })
        })
        .filter(Boolean)

      await Promise.all(promises)
      localStorage.setItem(WORK_DAYS_STORAGE_KEY, JSON.stringify(workDays))
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('저장에 실패했습니다')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return { workDays, daySchedules, isLoading, isSaving, error, toggleDay, setDayTime, saveSchedule }
}
