import { describe, expect, it } from 'vitest'
import type { WorkScheduleEventItem, WorkScheduleItem } from '../../api/attendanceApi'
import { formatWorkScheduleForDate, matchesWeekPattern } from '../attendanceSchedule'

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

  describe('formatWorkScheduleForDate', () => {
    it('날짜의 요일과 반복 주차에 맞는 예정 시간을 표시한다', () => {
      const schedules: WorkScheduleItem[] = [
        {
          id: 1,
          dayOfWeek: 'MONDAY',
          startTime: '09:00:00',
          endTime: '18:00:00',
          weekPattern: 'EVERY',
        },
      ]

      expect(formatWorkScheduleForDate(schedules, [], '2026-06-01')).toBe('09:00 - 18:00')
      expect(formatWorkScheduleForDate(schedules, [], '2026-06-02')).toBe('휴무')
    })

    it('날짜 예외 일정이 반복 일정 대신 표시된다', () => {
      const event: WorkScheduleEventItem = {
        id: 1,
        date: '2026-06-01',
        eventType: 'WORKING',
        startTime: '22:00:00',
        endTime: '06:00:00',
        endsNextDay: true,
        memberId: 1,
        memberName: '김리더',
        teamName: '1팀',
      }

      expect(formatWorkScheduleForDate([], [event], '2026-06-01')).toBe('22:00 - 다음날 06:00')
    })

    it('휴무 예외 일정은 휴무로 표시한다', () => {
      const event: WorkScheduleEventItem = {
        id: 2,
        date: '2026-06-01',
        eventType: 'DAY_OFF',
        startTime: null,
        endTime: null,
        memberId: 1,
        memberName: '김리더',
        teamName: '1팀',
      }

      expect(formatWorkScheduleForDate([], [event], '2026-06-01')).toBe('휴무')
    })
  })
})
