import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { useWorkSchedule } from '../useWorkSchedule'

const DEFAULT_SCHEDULES = [
  { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00' },
  { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00' },
]

const server = setupServer(
  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: DEFAULT_SCHEDULES }),
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
    })

    it('저장된 주차 패턴이 없으면 모든 요일이 매주 패턴이다', async () => {
      const { result } = await mountHook()
      expect(result.current.weekPatterns).toEqual([
        'EVERY',
        'EVERY',
        'EVERY',
        'EVERY',
        'EVERY',
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

    it('localStorage에 저장된 workDays를 마운트 시 복원한다', async () => {
      localStorage.setItem('yanus-work-days', JSON.stringify(
        [false, true, true, true, true, false, false],
      ))
      const { result } = await mountHook()
      expect(result.current.workDays[0]).toBe(false)
      expect(result.current.workDays[1]).toBe(true)
    })

    it('localStorage에 저장된 weekPatterns를 마운트 시 복원한다', async () => {
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
