import { describe, it, expect } from 'vitest'
import {
  formatTimeForDisplay,
  getCurrentTimeStr,
  parseDisplayTimeTo24,
  parseDateToStr,
  parseDateToTime,
  formatEventRange,
} from '../calendarUtils'

describe('formatTimeForDisplay', () => {
  it('오전 시간을 변환한다', () => {
    expect(formatTimeForDisplay('09:00')).toBe('9:00 오전')
  })
  it('오후 시간을 변환한다', () => {
    expect(formatTimeForDisplay('14:30')).toBe('2:30 오후')
  })
  it('자정을 변환한다', () => {
    expect(formatTimeForDisplay('00:00')).toBe('12:00 오전')
  })
  it('정오를 변환한다', () => {
    expect(formatTimeForDisplay('12:00')).toBe('12:00 오후')
  })
})

describe('parseDisplayTimeTo24', () => {
  it('오전 시간을 24시간제로 변환한다', () => {
    expect(parseDisplayTimeTo24('9:00 오전')).toBe('09:00')
  })
  it('오후 시간을 24시간제로 변환한다', () => {
    expect(parseDisplayTimeTo24('2:30 오후')).toBe('14:30')
  })
  it('빈 문자열은 기본값 반환한다', () => {
    expect(parseDisplayTimeTo24('')).toBe('09:00')
  })
})

describe('parseDateToStr', () => {
  it('Date 객체를 YYYY-MM-DD 형식으로 변환한다', () => {
    expect(parseDateToStr(new Date(2026, 2, 18))).toBe('2026-03-18')
  })
})

describe('parseDateToTime', () => {
  it('Date 객체에서 HH:MM 형식으로 변환한다', () => {
    const d = new Date(2026, 2, 18, 9, 5)
    expect(parseDateToTime(d)).toBe('09:05')
  })
})

describe('getCurrentTimeStr', () => {
  it('현재 시간을 HH:MM 형식으로 반환한다', () => {
    const result = getCurrentTimeStr()
    expect(result).toMatch(/^[0-9]{2}:[0-9]{2}$/)
  })
})

describe('formatEventRange', () => {
  it('이벤트 날짜 범위를 읽기 좋은 형식으로 반환한다', () => {
    const result = formatEventRange({
      startDate: '2026-03-18',
      startTime: '09:00',
      endDate: '2026-03-18',
      endTime: '10:00',
    })
    expect(result).toContain('3월 18일')
    expect(result).toContain('~')
  })
})
