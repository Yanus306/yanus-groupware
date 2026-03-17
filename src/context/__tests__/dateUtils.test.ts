import { describe, it, expect } from 'vitest'
import { formatDateDisplay, getTodayStr } from '../../shared/lib/date'

describe('getTodayStr', () => {
  it('오늘 날짜를 YYYY-MM-DD 형식으로 반환한다', () => {
    const today = new Date()
    const expected = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')
    expect(getTodayStr()).toBe(expected)
  })
})

describe('formatDateDisplay', () => {
  it('오늘 날짜를 "오늘"로 반환한다', () => {
    const today = new Date()
    expect(formatDateDisplay(getTodayStr(), today)).toBe('오늘')
  })

  it('내일 날짜를 "내일"로 반환한다', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-')
    expect(formatDateDisplay(tomorrowStr, today)).toBe('내일')
  })

  it('다른 날짜는 "X요일, M월 D일" 형식으로 반환한다', () => {
    const base = new Date('2025-01-01')
    const result = formatDateDisplay('2025-01-03', base)
    expect(result).toMatch(/요일/)
    expect(result).toMatch(/월/)
    expect(result).toMatch(/일/)
  })
})
