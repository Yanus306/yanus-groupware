import { describe, expect, it } from 'vitest'
import { matchesWeekPattern } from '../attendanceSchedule'

describe('attendanceSchedule', () => {
  describe('matchesWeekPattern', () => {
    it('EVERY 또는 값 없음은 모든 날짜에 매칭된다', () => {
      const date = new Date('2026-06-01T12:00:00')

      expect(matchesWeekPattern(date, 'EVERY')).toBe(true)
      expect(matchesWeekPattern(date, undefined)).toBe(true)
    })

    it('FIRST/SECOND/THIRD/FOURTH는 월 안의 같은 요일 발생 순서로 매칭된다', () => {
      expect(matchesWeekPattern(new Date('2026-06-01T12:00:00'), 'FIRST')).toBe(true)
      expect(matchesWeekPattern(new Date('2026-06-08T12:00:00'), 'SECOND')).toBe(true)
      expect(matchesWeekPattern(new Date('2026-06-15T12:00:00'), 'THIRD')).toBe(true)
      expect(matchesWeekPattern(new Date('2026-06-22T12:00:00'), 'FOURTH')).toBe(true)
    })

    it('LAST는 7일 뒤가 다음 달인 같은 요일에만 매칭된다', () => {
      expect(matchesWeekPattern(new Date('2026-06-22T12:00:00'), 'LAST')).toBe(false)
      expect(matchesWeekPattern(new Date('2026-06-29T12:00:00'), 'LAST')).toBe(true)
    })
  })
})
