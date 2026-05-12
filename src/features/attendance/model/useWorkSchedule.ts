import { useState, useEffect } from 'react'
import {
  deleteWorkScheduleDay,
  getMyWorkSchedule,
  getWorkScheduleEvents,
  upsertWorkScheduleDay,
} from '../../../shared/api/attendanceApi'
import type { DayOfWeek, WeekPattern, WorkScheduleEventItem } from '../../../shared/api/attendanceApi'
import { ApiError } from '../../../shared/api/baseClient'
import { getTodayStr } from '../../../shared/lib/date'

export interface DaySchedule {
  checkInTime: string   // "HH:mm"
  checkOutTime: string  // "HH:mm"
  endsNextDay: boolean
}

export type TodayScheduleSource = 'RECURRING' | 'DATE_EVENT' | 'DAY_OFF' | 'NONE'

export type { WeekPattern } from '../../../shared/api/attendanceApi'

// 배열 인덱스 ↔ DayOfWeek 매핑 (0=Mon, 1=Tue, ..., 6=Sun)
const INDEX_TO_DOW: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
]

const WORK_DAYS_STORAGE_KEY = 'yanus-work-days'
const WORK_WEEK_PATTERNS_STORAGE_KEY = 'yanus-work-week-patterns'
const WORK_ENDS_NEXT_DAY_STORAGE_KEY = 'yanus-work-ends-next-day'
const DEFAULT_CHECK_IN = '09:00'
const DEFAULT_CHECK_OUT = '18:00'
const DEFAULT_WORK_DAYS = [false, false, false, false, false, false, false]
const DEFAULT_WEEK_PATTERNS: WeekPattern[] = Array.from({ length: 7 }, () => 'EVERY')

function makeDefaultDaySchedules(checkIn: string, checkOut: string): DaySchedule[] {
  return Array.from({ length: 7 }, () => ({ checkInTime: checkIn, checkOutTime: checkOut, endsNextDay: false }))
}

function getEventType(event: WorkScheduleEventItem) {
  return event.eventType ?? 'WORKING'
}

function toDaySchedule(event: WorkScheduleEventItem): DaySchedule | null {
  if (!event.startTime || !event.endTime) return null

  return {
    checkInTime: event.startTime.slice(0, 5),
    checkOutTime: event.endTime.slice(0, 5),
    endsNextDay: Boolean(event.endsNextDay),
  }
}

export function useWorkSchedule() {
  const [today] = useState(() => getTodayStr())
  const [workDays, setWorkDays] = useState<boolean[]>(DEFAULT_WORK_DAYS)
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
    makeDefaultDaySchedules(DEFAULT_CHECK_IN, DEFAULT_CHECK_OUT),
  )
  const [weekPatterns, setWeekPatterns] = useState<WeekPattern[]>(DEFAULT_WEEK_PATTERNS)
  const [todayOverride, setTodayOverride] = useState<WorkScheduleEventItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedWorkDays, setSavedWorkDays] = useState<boolean[]>(DEFAULT_WORK_DAYS)

  useEffect(() => {
    const storedDays = localStorage.getItem(WORK_DAYS_STORAGE_KEY)
    let parsedStoredDays: boolean[] | null = null
    if (storedDays) {
      try {
        const parsed = JSON.parse(storedDays) as boolean[]
        if (Array.isArray(parsed) && parsed.length === 7) {
          parsedStoredDays = parsed
        }
      } catch {
        // Ignore malformed localStorage and prefer the API response.
      }
    }

    // localStorage에서 근무 요일 토글 상태는 API 조회 실패 시에만 fallback으로 사용
    const storedWeekPatterns = localStorage.getItem(WORK_WEEK_PATTERNS_STORAGE_KEY)
    if (storedWeekPatterns) {
      try {
        const parsed = JSON.parse(storedWeekPatterns) as WeekPattern[]
        if (Array.isArray(parsed) && parsed.length === 7) setWeekPatterns(parsed)
      } catch {
        // Ignore malformed localStorage and keep the default recurrence pattern.
      }
    }

    const storedEndsNextDay = localStorage.getItem(WORK_ENDS_NEXT_DAY_STORAGE_KEY)
    if (storedEndsNextDay) {
      try {
        const parsed = JSON.parse(storedEndsNextDay) as boolean[]
        if (Array.isArray(parsed) && parsed.length === 7) {
          setDaySchedules((prev) =>
            prev.map((schedule, index) => ({ ...schedule, endsNextDay: parsed[index] ?? false })),
          )
        }
      } catch {
        // Ignore malformed localStorage and keep same-day end defaults.
      }
    }

    const loadTodayOverride = getWorkScheduleEvents(today, today)
      .then((items) => {
        setTodayOverride(items.find((item) => item.date === today) ?? null)
      })
      .catch(() => {
        setTodayOverride(null)
      })

    // API에서 요일별 근무 시간 불러오기
    const loadRecurringSchedule = getMyWorkSchedule()
      .then((items) => {
        const activeDays = INDEX_TO_DOW.map((dow) =>
          items.some((item) => item.dayOfWeek === dow),
        )

        setSavedWorkDays(activeDays)
        setWorkDays(activeDays)

        if (items.length === 0) return
        setDaySchedules((prev) => {
          const next = [...prev]
          for (const item of items) {
            const idx = INDEX_TO_DOW.indexOf(item.dayOfWeek)
            if (idx >= 0) {
              next[idx] = {
                checkInTime: item.startTime.slice(0, 5),
                checkOutTime: item.endTime.slice(0, 5),
                endsNextDay: Boolean(item.endsNextDay),
              }
            }
          }
          return next
        })
        setWeekPatterns((prev) => {
          const next = [...prev]
          for (const item of items) {
            const idx = INDEX_TO_DOW.indexOf(item.dayOfWeek)
            if (idx >= 0) {
              next[idx] = item.weekPattern ?? 'EVERY'
            }
          }
          return next
        })
      })
      .catch(() => {
        if (parsedStoredDays) {
          setWorkDays(parsedStoredDays)
          setSavedWorkDays(parsedStoredDays)
        }
      })

    Promise.allSettled([loadRecurringSchedule, loadTodayOverride]).finally(() => setIsLoading(false))
  }, [today])

  const toggleDay = (index: number) => {
    setWorkDays((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  const setDayTime = (index: number, field: 'checkInTime' | 'checkOutTime', value: string) => {
    setDaySchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const setWeekPattern = (index: number, value: WeekPattern) => {
    setWeekPatterns((prev) => prev.map((pattern, i) => (i === index ? value : pattern)))
  }

  const setDayEndsNextDay = (index: number, value: boolean) => {
    setDaySchedules((prev) => prev.map((schedule, i) => (i === index ? { ...schedule, endsNextDay: value } : schedule)))
  }

  const saveSchedule = async () => {
    setIsSaving(true)
    setError(null)
    let saved = false
    try {
      const upsertPromises = workDays
        .map((active, i) => {
          if (!active) return null
          return upsertWorkScheduleDay({
            dayOfWeek: INDEX_TO_DOW[i],
            startTime: daySchedules[i].checkInTime + ':00',
            endTime: daySchedules[i].checkOutTime + ':00',
            weekPattern: weekPatterns[i],
            endsNextDay: daySchedules[i].endsNextDay,
          })
        })
        .filter(Boolean)

      const deletePromises = workDays
        .map((active, i) => {
          if (active || !savedWorkDays[i]) return null
          return deleteWorkScheduleDay(INDEX_TO_DOW[i])
        })
        .filter(Boolean)

      await Promise.all([...upsertPromises, ...deletePromises])
      setSavedWorkDays([...workDays])
      localStorage.setItem(WORK_DAYS_STORAGE_KEY, JSON.stringify(workDays))
      localStorage.setItem(WORK_WEEK_PATTERNS_STORAGE_KEY, JSON.stringify(weekPatterns))
      localStorage.setItem(
        WORK_ENDS_NEXT_DAY_STORAGE_KEY,
        JSON.stringify(daySchedules.map((schedule) => schedule.endsNextDay)),
      )
      saved = true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('저장에 실패했습니다')
      }
    } finally {
      setIsSaving(false)
    }

    return saved
  }

  const todayIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const todayRecurringEnabled = workDays[todayIndex]
  const todayRecurringSchedule = daySchedules[todayIndex]
  const todayOverrideType = todayOverride ? getEventType(todayOverride) : null
  const todayOverrideSchedule = todayOverride && todayOverrideType === 'WORKING'
    ? toDaySchedule(todayOverride)
    : null
  const todayWorkEnabled = todayOverrideType === 'DAY_OFF'
    ? false
    : todayOverrideSchedule
      ? true
      : todayRecurringEnabled
  const todayWorkSchedule = todayOverrideSchedule ?? todayRecurringSchedule
  const todayScheduleSource: TodayScheduleSource = todayOverrideType === 'DAY_OFF'
    ? 'DAY_OFF'
    : todayOverrideSchedule
      ? 'DATE_EVENT'
      : todayRecurringEnabled
        ? 'RECURRING'
        : 'NONE'

  return {
    workDays,
    daySchedules,
    weekPatterns,
    todayWorkEnabled,
    todayWorkSchedule,
    todayScheduleSource,
    isLoading,
    isSaving,
    error,
    toggleDay,
    setDayTime,
    setDayEndsNextDay,
    setWeekPattern,
    saveSchedule,
  }
}
