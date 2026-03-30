const KOREA_TIMEZONE = 'Asia/Seoul'

function formatParts(date: Date, timeZone = KOREA_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value
    }
    return acc
  }, {})
}

export function getTodayStr(): string {
  const parts = formatParts(new Date())
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseDateString(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

export function getWeekRange(baseDateStr: string): { start: string; end: string } {
  const baseDate = parseDateString(baseDateStr)
  const start = new Date(baseDate)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    start: toDateString(start),
    end: toDateString(end),
  }
}

export function getMonthRange(baseDateStr: string): { start: string; end: string } {
  const baseDate = parseDateString(baseDateStr)
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 12)
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 12)

  return {
    start: toDateString(start),
    end: toDateString(end),
  }
}

export function getDateStringsBetween(startDateStr: string, endDateStr: string): string[] {
  const start = parseDateString(startDateStr)
  const end = parseDateString(endDateStr)
  const dates: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    dates.push(toDateString(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function formatDateRangeLabel(startDateStr: string, endDateStr: string): string {
  if (startDateStr === endDateStr) {
    return startDateStr
  }
  return `${startDateStr} ~ ${endDateStr}`
}

export function formatDateRangeToken(startDateStr: string, endDateStr: string): string {
  if (startDateStr === endDateStr) {
    return startDateStr
  }
  return `${startDateStr}_to_${endDateStr}`
}

export function formatDateDisplay(dateStr: string, baseDate: Date): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (taskDay.getTime() === today.getTime()) return '오늘'
  if (taskDay.getTime() === tomorrow.getTime()) return '내일'
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${days[d.getDay()]}요일, ${d.getMonth() + 1}월 ${d.getDate()}일`
}
