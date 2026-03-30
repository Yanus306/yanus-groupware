import { describe, it, expect } from 'vitest'
import { formatDateDisplay, getTodayStr, parseDateString, toDateString } from '../../shared/lib/date'

describe('getTodayStr', () => {
  it('오늘 날짜를 YYYY-MM-DD 형식으로 반환한다', () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
      .reduce<Record<string, string>>((acc, part) => {
        if (part.type !== 'literal') {
          acc[part.type] = part.value
        }
        return acc
      }, {})

    const expected = [parts.year, parts.month, parts.day].join('-')
    expect(getTodayStr()).toBe(expected)
  })
})

describe('formatDateDisplay', () => {
  it('오늘 날짜를 "오늘"로 반환한다', () => {
    const todayStr = getTodayStr()
    expect(formatDateDisplay(todayStr, parseDateString(todayStr))).toBe('오늘')
  })

  it('내일 날짜를 "내일"로 반환한다', () => {
    const todayStr = getTodayStr()
    const today = parseDateString(todayStr)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(formatDateDisplay(toDateString(tomorrow), today)).toBe('내일')
  })

  it('다른 날짜는 "X요일, M월 D일" 형식으로 반환한다', () => {
    const base = new Date('2025-01-01')
    const result = formatDateDisplay('2025-01-03', base)
    expect(result).toMatch(/요일/)
    expect(result).toMatch(/월/)
    expect(result).toMatch(/일/)
  })
})
