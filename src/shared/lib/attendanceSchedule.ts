import { parseDateString, toDateString } from './date'
import type { WeekPattern } from '../api/attendanceApi'

function sliceClock(value: string | null | undefined) {
  if (!value) return '-'
  if (value.includes('T')) {
    return value.slice(11, 16)
  }
  return value.slice(0, 5)
}

function isNextDayRange(startAt: string | null | undefined, endAt: string | null | undefined) {
  if (!startAt || !endAt) return false
  return endAt.slice(0, 10) > startAt.slice(0, 10)
}

export function addDaysToDateString(dateStr: string, days: number) {
  const date = parseDateString(dateStr)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

export function formatScheduleRangeLabel({
  startTime,
  endTime,
  endsNextDay,
  scheduledStartAt,
  scheduledEndAt,
}: {
  startTime: string | null | undefined
  endTime: string | null | undefined
  endsNextDay?: boolean | null
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
}) {
  const startLabel = sliceClock(scheduledStartAt ?? startTime)
  const endLabel = sliceClock(scheduledEndAt ?? endTime)

  if (startLabel === '-' && endLabel === '-') {
    return '-'
  }

  const spansNextDay = Boolean(endsNextDay) || isNextDayRange(scheduledStartAt, scheduledEndAt)
  return spansNextDay ? `${startLabel} - 다음날 ${endLabel}` : `${startLabel} - ${endLabel}`
}

export function formatDateTimeClock(value: string | null | undefined) {
  return sliceClock(value)
}

function getOccurrencePattern(date: Date): Exclude<WeekPattern, 'EVERY' | 'LAST'> {
  const occurrence = Math.floor((date.getDate() - 1) / 7) + 1
  if (occurrence === 1) return 'FIRST'
  if (occurrence === 2) return 'SECOND'
  if (occurrence === 3) return 'THIRD'
  return 'FOURTH'
}

function isLastOccurrence(date: Date) {
  const nextWeek = new Date(date)
  nextWeek.setDate(date.getDate() + 7)
  return nextWeek.getMonth() !== date.getMonth()
}

export function matchesWeekPattern(date: Date, pattern: WeekPattern | undefined) {
  const normalized = pattern ?? 'EVERY'
  if (normalized === 'EVERY') return true
  if (normalized === 'LAST') return isLastOccurrence(date)
  return getOccurrencePattern(date) === normalized
}
