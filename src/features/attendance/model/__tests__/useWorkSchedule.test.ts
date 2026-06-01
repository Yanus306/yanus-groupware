import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { useWorkSchedule } from '../useWorkSchedule'
import type { WeekPattern } from '../../../../shared/api/attendanceApi'
import { matchesWeekPattern } from '../../../../shared/lib/attendanceSchedule'

const TODAY = new Date().toISOString().slice(0, 10)
const TODAY_INDEX = (new Date(`${TODAY}T12:00:00`).getDay() + 6) % 7
const INDEX_TO_DOW = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

const DEFAULT_SCHEDULES = [
  { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY', endsNextDay: false },
  { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY', endsNextDay: false },
  { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'SECOND', endsNextDay: false },
  { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00', weekPattern: 'EVERY', endsNextDay: false },
  { id: 5, dayOfWeek: 'FRIDAY', startTime: '22:00:00', endTime: '06:00:00', weekPattern: 'LAST', endsNextDay: true },
]

function getNonMatchingPattern(dateStr: string): Exclude<WeekPattern, 'EVERY'> {
  const date = new Date(`${dateStr}T12:00:00`)
  return (['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'LAST'] as const).find(
    (pattern) => !matchesWeekPattern(date, pattern),
  ) ?? 'FIRST'
}

const server = setupServer(
  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: DEFAULT_SCHEDULES }),
  ),
  http.get('/api/v1/work-schedule-events', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
  ),
  http.put('/api/v1/work-schedules', async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { id: Date.now(), ...body } })
  }),
  http.delete('/api/v1/work-schedules/:dayOfWeek', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

async function mountHook() {
  const hook = renderHook(() => useWorkSchedule())
  await act(async () => {})
  return hook
}

describe('useWorkSchedule', () => {
  describe('초기 상태', () => {
    it('저장된 스케줄이 없으면 기본 workDays는 모두 비활성이다', async () => {
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
        ),
      )
      const { result } = await mountHook()
      expect(result.current.workDays).toEqual([false, false, false, false, false, false, false])
    })

    it('마운트 시 API에서 요일별 시간을 불러온다', async () => {
      const { result } = await mountHook()
      expect(result.current.daySchedules[0].checkInTime).toBe('09:00')
      expect(result.current.daySchedules[0].checkOutTime).toBe('18:00')
      expect(result.current.daySchedules[4].endsNextDay).toBe(true)
    })

    it('저장된 주차 패턴이 없으면 모든 요일이 매주 패턴이다', async () => {
      const { result } = await mountHook()
      expect(result.current.weekPatterns).toEqual([
        'EVERY',
        'EVERY',
        'SECOND',
        'EVERY',
        'LAST',
        'EVERY',
        'EVERY',
      ])
    })

    it('로드 완료 후 isLoading이 false가 된다', async () => {
      const { result } = await mountHook()
      expect(result.current.isLoading).toBe(false)
    })

    it('API 응답에 있는 요일만 활성화한다 (localStorage 없을 때)', async () => {
      const { result } = await mountHook()
      expect(result.current.workDays.slice(0, 5)).toEqual([true, true, true, true, true])
      expect(result.current.workDays[5]).toBe(false)
      expect(result.current.workDays[6]).toBe(false)
    })

    it('오늘 날짜별 DAY_OFF가 있으면 반복 일정은 유지하되 오늘 적용 일정만 휴무로 본다', async () => {
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({
            code: 'SUCCESS',
            message: 'ok',
            data: [
              {
                id: 100,
                dayOfWeek: INDEX_TO_DOW[TODAY_INDEX],
                startTime: '09:00:00',
                endTime: '18:00:00',
                weekPattern: 'EVERY',
                endsNextDay: false,
              },
            ],
          }),
        ),
        http.get('/api/v1/work-schedule-events', () =>
          HttpResponse.json({
            code: 'SUCCESS',
            message: 'ok',
            data: [
              {
                id: 200,
                date: TODAY,
                eventType: 'DAY_OFF',
                startTime: null,
                endTime: null,
                endsNextDay: false,
                memberId: 1,
                memberName: '김리더',
                teamName: '1팀',
              },
            ],
          }),
        ),
      )

      const { result } = await mountHook()

      expect(result.current.workDays[TODAY_INDEX]).toBe(true)
      expect(result.current.todayWorkEnabled).toBe(false)
      expect(result.current.todayScheduleSource).toBe('DAY_OFF')
    })

    it('오늘 날짜별 WORKING이 있으면 반복 일정이 없어도 오늘 적용 일정으로 본다', async () => {
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
        ),
        http.get('/api/v1/work-schedule-events', () =>
          HttpResponse.json({
            code: 'SUCCESS',
            message: 'ok',
            data: [
              {
                id: 201,
                date: TODAY,
                eventType: 'WORKING',
                startTime: '13:00:00',
                endTime: '18:30:00',
                endsNextDay: false,
                memberId: 1,
                memberName: '김리더',
                teamName: '1팀',
              },
            ],
          }),
        ),
      )

      const { result } = await mountHook()

      expect(result.current.workDays[TODAY_INDEX]).toBe(false)
      expect(result.current.todayWorkEnabled).toBe(true)
      expect(result.current.todayWorkSchedule).toMatchObject({
        checkInTime: '13:00',
        checkOutTime: '18:30',
        endsNextDay: false,
      })
      expect(result.current.todayScheduleSource).toBe('DATE_EVENT')
    })

    it('오늘 요일의 반복 일정이 있어도 주차 패턴이 맞지 않으면 휴무로 본다', async () => {
      const nonMatchingPattern = getNonMatchingPattern(TODAY)
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({
            code: 'SUCCESS',
            message: 'ok',
            data: [
              {
                id: 300,
                dayOfWeek: INDEX_TO_DOW[TODAY_INDEX],
                startTime: '09:00:00',
                endTime: '18:00:00',
                weekPattern: nonMatchingPattern,
                endsNextDay: false,
              },
            ],
          }),
        ),
      )

      const { result } = await mountHook()

      expect(result.current.workDays[TODAY_INDEX]).toBe(true)
      expect(result.current.todayWorkEnabled).toBe(false)
      expect(result.current.todayScheduleSource).toBe('NONE')
    })
  })

  describe('toggleDay', () => {
    it('비활성 요일을 활성화할 수 있다', async () => {
      const { result } = await mountHook()
      act(() => { result.current.toggleDay(5) }) // 토요일 활성화
      expect(result.current.workDays[5]).toBe(true)
    })

    it('활성 요일을 비활성화할 수 있다', async () => {
      const { result } = await mountHook()
      act(() => { result.current.toggleDay(0) }) // 월요일 비활성화
      expect(result.current.workDays[0]).toBe(false)
    })
  })

  describe('setDayTime', () => {
    it('특정 요일의 출근 시간을 변경할 수 있다', async () => {
      const { result } = await mountHook()
      act(() => { result.current.setDayTime(0, 'checkInTime', '08:00') })
      expect(result.current.daySchedules[0].checkInTime).toBe('08:00')
    })

    it('특정 요일의 퇴근 시간을 변경할 수 있다', async () => {
      const { result } = await mountHook()
      act(() => { result.current.setDayTime(2, 'checkOutTime', '17:30') })
      expect(result.current.daySchedules[2].checkOutTime).toBe('17:30')
    })

    it('다른 요일 시간에는 영향을 주지 않는다', async () => {
      const { result } = await mountHook()
      act(() => { result.current.setDayTime(0, 'checkInTime', '08:00') })
      expect(result.current.daySchedules[1].checkInTime).toBe('09:00')
    })
  })

  describe('setWeekPattern', () => {
    it('특정 요일의 주차 패턴을 변경할 수 있다', async () => {
      const { result } = await mountHook()
      act(() => { result.current.setWeekPattern(0, 'SECOND') })
      expect(result.current.weekPatterns[0]).toBe('SECOND')
    })
  })

  describe('saveSchedule', () => {
    it('저장 시 API를 호출하고 isSaving이 false로 돌아온다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.saveSchedule() })
      expect(result.current.isSaving).toBe(false)
    })

    it('저장 시 localStorage에 workDays가 저장된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.saveSchedule() })
      const stored = localStorage.getItem('yanus-work-days')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(7)
    })

    it('저장 시 localStorage에 weekPatterns가 저장된다', async () => {
      const { result } = await mountHook()
      act(() => {
        result.current.setWeekPattern(0, 'THIRD')
      })

      await act(async () => {
        await result.current.saveSchedule()
      })

      const stored = localStorage.getItem('yanus-work-week-patterns')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)[0]).toBe('THIRD')
    })

    it('저장 시 localStorage에 endsNextDay 상태가 저장된다', async () => {
      const { result } = await mountHook()

      act(() => {
        result.current.setDayEndsNextDay(0, true)
      })

      await act(async () => {
        await result.current.saveSchedule()
      })

      const stored = localStorage.getItem('yanus-work-ends-next-day')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)[0]).toBe(true)
    })

    it('서버에 저장된 근무 일정이 있으면 localStorage보다 API 응답을 우선한다', async () => {
      localStorage.setItem('yanus-work-days', JSON.stringify(
        [false, true, true, true, true, false, false],
      ))
      const { result } = await mountHook()
      expect(result.current.workDays.slice(0, 5)).toEqual([true, true, true, true, true])
    })

    it('근무 일정 조회가 실패하면 localStorage 저장값을 fallback으로 복원한다', async () => {
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({ code: 'ERROR', message: '불러오기 실패' }, { status: 500 }),
        ),
      )

      localStorage.setItem('yanus-work-days', JSON.stringify(
        [false, true, true, false, false, false, false],
      ))

      const { result } = await mountHook()
      expect(result.current.workDays).toEqual([false, true, true, false, false, false, false])
    })

    it('localStorage에 저장된 weekPatterns를 마운트 시 복원한다', async () => {
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
        ),
      )

      localStorage.setItem('yanus-work-week-patterns', JSON.stringify([
        'LAST',
        'EVERY',
        'EVERY',
        'EVERY',
        'EVERY',
        'EVERY',
        'EVERY',
      ]))

      const { result } = await mountHook()
      expect(result.current.weekPatterns[0]).toBe('LAST')
    })

    it('localStorage에 저장된 endsNextDay를 마운트 시 복원한다', async () => {
      server.use(
        http.get('/api/v1/work-schedules/me', () =>
          HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
        ),
      )

      localStorage.setItem('yanus-work-ends-next-day', JSON.stringify([
        true,
        false,
        false,
        false,
        false,
        false,
        false,
      ]))

      const { result } = await mountHook()
      expect(result.current.daySchedules[0].endsNextDay).toBe(true)
    })

    it('기존에 저장된 요일을 비활성화하면 삭제 API를 호출한다', async () => {
      let deletedDay = ''
      server.use(
        http.delete('/api/v1/work-schedules/:dayOfWeek', ({ params }) => {
          deletedDay = String(params.dayOfWeek)
          return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
        }),
      )

      const { result } = await mountHook()
      act(() => {
        result.current.toggleDay(0)
      })

      await act(async () => {
        await result.current.saveSchedule()
      })

      expect(deletedDay).toBe('MONDAY')
    })

    it('API 응답의 weekPattern 값을 우선 반영한다', async () => {
      const { result } = await mountHook()
      expect(result.current.weekPatterns[2]).toBe('SECOND')
      expect(result.current.weekPatterns[4]).toBe('LAST')
    })

    it('API 에러 시 error 메시지가 설정된다', async () => {
      server.use(
        http.put('/api/v1/work-schedules', () =>
          HttpResponse.json({ code: 'ERROR', message: '저장 실패' }, { status: 500 }),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.saveSchedule() })
      expect(result.current.error).not.toBeNull()
    })
  })
})
