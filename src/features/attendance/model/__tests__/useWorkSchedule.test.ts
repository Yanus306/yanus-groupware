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
    it('기본 workDays는 월-금 활성, 토-일 비활성이다', async () => {
      const { result } = await mountHook()
      expect(result.current.workDays).toEqual([true, true, true, true, true, false, false])
    })

    it('마운트 시 API에서 요일별 시간을 불러온다', async () => {
      const { result } = await mountHook()
      expect(result.current.daySchedules[0].checkInTime).toBe('09:00')
      expect(result.current.daySchedules[0].checkOutTime).toBe('18:00')
    })

    it('로드 완료 후 isLoading이 false가 된다', async () => {
      const { result } = await mountHook()
      expect(result.current.isLoading).toBe(false)
    })

    it('API 응답에 있는 요일만 활성화한다 (localStorage 없을 때)', async () => {
      const { result } = await mountHook()
      // API에 MONDAY~FRIDAY만 있으므로 0~4만 true
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

    it('localStorage에 저장된 workDays를 마운트 시 복원한다', async () => {
      localStorage.setItem('yanus-work-days', JSON.stringify(
        [false, true, true, true, true, false, false],
      ))
      const { result } = await mountHook()
      expect(result.current.workDays[0]).toBe(false)
      expect(result.current.workDays[1]).toBe(true)
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
