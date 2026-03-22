import { useState, useEffect } from 'react'
import { getMyWorkSchedule, updateWorkSchedule } from '../../../shared/api/attendanceApi'
import { ApiError } from '../../../shared/api/baseClient'

export interface DaySchedule {
  checkInTime: string   // "HH:mm"
  checkOutTime: string  // "HH:mm"
}

const STORAGE_KEY = 'yanus-work-schedule'
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
    // localStorage에 저장된 스케줄 복원
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { workDays: boolean[]; daySchedules: DaySchedule[] }
        if (Array.isArray(parsed.workDays)) setWorkDays(parsed.workDays)
        if (Array.isArray(parsed.daySchedules)) setDaySchedules(parsed.daySchedules)
      } catch {}
    }

    // API에서 기본 시간 불러오기 (localStorage 데이터 없을 때만 덮어씀)
    getMyWorkSchedule()
      .then((schedule) => {
        if (!stored) {
          const checkIn = schedule.workStartTime.slice(0, 5)
          const checkOut = schedule.workEndTime.slice(0, 5)
          setDaySchedules(makeDefaultDaySchedules(checkIn, checkOut))
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
      // 첫 번째 활성 요일의 시간을 API 기본값으로 전송
      const activeIdx = workDays.findIndex((d) => d)
      const activeSchedule = activeIdx >= 0 ? daySchedules[activeIdx] : daySchedules[0]
      await updateWorkSchedule({
        workStartTime: activeSchedule.checkInTime + ':00',
        workEndTime: activeSchedule.checkOutTime + ':00',
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ workDays, daySchedules }))
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
