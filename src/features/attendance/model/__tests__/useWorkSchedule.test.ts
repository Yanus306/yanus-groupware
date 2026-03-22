import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { useWorkSchedule } from '../useWorkSchedule'

const DEFAULT_SCHEDULE = {
  id: 1,
  memberId: 1,
  workStartTime: '09:00:00',
  workEndTime: '18:00:00',
  breakStartTime: '12:00:00',
  breakEndTime: '13:00:00',
}

const server = setupServer(
  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: DEFAULT_SCHEDULE }),
  ),
  http.put('/api/v1/work-schedules', async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { ...DEFAULT_SCHEDULE, ...body } })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
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

    it('마운트 시 API에서 시간을 불러와 전체 요일 기본값으로 설정한다', async () => {
      const { result } = await mountHook()
      expect(result.current.daySchedules[0].checkInTime).toBe('09:00')
      expect(result.current.daySchedules[0].checkOutTime).toBe('18:00')
    })

    it('로드 완료 후 isLoading이 false가 된다', async () => {
      const { result } = await mountHook()
      expect(result.current.isLoading).toBe(false)
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

    it('저장 시 localStorage에 스케줄이 저장된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.saveSchedule() })
      const stored = localStorage.getItem('yanus-work-schedule')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.workDays).toEqual([true, true, true, true, true, false, false])
    })

    it('localStorage에 저장된 스케줄을 마운트 시 복원한다', async () => {
      localStorage.setItem('yanus-work-schedule', JSON.stringify({
        workDays: [false, true, true, true, true, false, false],
        daySchedules: Array.from({ length: 7 }, () => ({ checkInTime: '10:00', checkOutTime: '19:00' })),
      }))
      const { result } = await mountHook()
      expect(result.current.workDays[0]).toBe(false)
      expect(result.current.daySchedules[0].checkInTime).toBe('10:00')
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
