import { parseDateString, toDateString } from './date'

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
