import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { useWorkSession } from '../useWorkSession'
import { getTodayStr } from '../../../../shared/lib/date'

const CLOCK_IN_RECORD = {
  id: 1, memberId: 1, memberName: '테스터',
  workDate: '2026-03-22', checkInTime: '2026-03-22T09:00:00', checkOutTime: null, status: 'WORKING',
}
const CLOCK_OUT_RECORD = {
  id: 1, memberId: 1, memberName: '테스터',
  workDate: '2026-03-22', checkInTime: '2026-03-22T09:00:00', checkOutTime: '2026-03-22T18:00:00', status: 'LEFT',
}
const OVERNIGHT_CLOCK_OUT_RECORD = {
  id: 2, memberId: 1, memberName: '테스터',
  workDate: '2026-03-21', checkInTime: '2026-03-21T23:00:00', checkOutTime: '2026-03-22T01:00:00', status: 'LEFT',
}

const server = setupServer(
  http.get('/api/v1/attendances/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
  ),
  http.delete('/api/v1/attendances/me', () =>
    new HttpResponse(null, { status: 200 }),
  ),
  http.post('/api/v1/attendances/check-in', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: CLOCK_IN_RECORD }),
  ),
  http.post('/api/v1/attendances/check-out', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: CLOCK_OUT_RECORD }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => { server.resetHandlers(); localStorage.clear() })
afterAll(() => server.close())

/** 초기 getMyAttendance() 비동기 효과가 완료될 때까지 flush */
async function mountHook() {
  const hook = renderHook(() => useWorkSession())
  await act(async () => {})
  return hook
}

describe('useWorkSession', () => {
  describe('로딩 상태', () => {
    it('초기 isLoading은 true이다', () => {
      const { result } = renderHook(() => useWorkSession())
      expect(result.current.isLoading).toBe(true)
    })

    it('초기 로드 완료 후 isLoading이 false가 된다', async () => {
      const { result } = await mountHook()
      expect(result.current.isLoading).toBe(false)
    })

    it('출근/퇴근 처리 완료 후 isLoading이 false가 된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('API 실패 시 상태 롤백', () => {
    it('출근 API 실패 시 idle 상태를 유지한다', async () => {
      server.use(
        http.post('/api/v1/attendances/check-in', () =>
          HttpResponse.json({ code: 'SERVER_ERROR', message: '서버 오류', data: null }, { status: 500 }),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      expect(result.current.status).toBe('idle')
    })

    it('퇴근 API 실패(INVALID_CHECKOUT_TIME) 시 working 상태를 유지한다', async () => {
      server.use(
        http.post('/api/v1/attendances/check-out', () =>
          HttpResponse.json({ code: 'INVALID_CHECKOUT_TIME', message: '잘못된 퇴근 시간', data: null }, { status: 400 }),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle → working
      await act(async () => { await result.current.handleClockClick() }) // working → 실패 → working 유지
      expect(result.current.status).toBe('working')
    })
  })

  describe('초기 상태', () => {
    it('초기 상태는 idle이다', async () => {
      const { result } = await mountHook()
      expect(result.current.status).toBe('idle')
    })

    it('초기 clockIn은 null이다', async () => {
      const { result } = await mountHook()
      expect(result.current.clockIn).toBeNull()
    })

    it('초기 clockOut은 null이다', async () => {
      const { result } = await mountHook()
      expect(result.current.clockOut).toBeNull()
    })

    it('초기 errorMessage는 null이다', async () => {
      const { result } = await mountHook()
      expect(result.current.errorMessage).toBeNull()
    })
  })

  describe('출근 처리', () => {
    it('idle 상태에서 handleClockClick 호출 시 working 상태가 된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      expect(result.current.status).toBe('working')
    })

    it('출근 시 clockIn이 설정된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      expect(result.current.clockIn).not.toBeNull()
    })
  })

  describe('퇴근 처리', () => {
    it('working 상태에서 handleClockClick 호출 시 done 상태가 된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle -> working
      await act(async () => { await result.current.handleClockClick() }) // working -> done
      expect(result.current.status).toBe('done')
    })

    it('퇴근 시 clockOut이 설정된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      await act(async () => { await result.current.handleClockClick() })
      expect(result.current.clockOut).not.toBeNull()
    })
  })

  describe('재출근 처리', () => {
    it('done 상태에서 handleClockClick 호출 시 서버 초기화 후 idle로 전환된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle -> working
      await act(async () => { await result.current.handleClockClick() }) // working -> done
      await act(async () => { await result.current.handleClockClick() }) // done -> idle
      expect(result.current.status).toBe('idle')
      expect(result.current.clockIn).toBeNull()
      expect(result.current.clockOut).toBeNull()
      expect(result.current.errorMessage).toBe('오늘 출근 기록을 초기화했습니다')
    })

    it('자정 넘겨 퇴근한 기록은 실제 workDate로 초기화 요청을 보낸다', async () => {
      let requestedDate: string | null = null

      server.use(
        http.post('/api/v1/attendances/check-out', () =>
          HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: OVERNIGHT_CLOCK_OUT_RECORD }),
        ),
        http.delete('/api/v1/attendances/me', ({ request }) => {
          const url = new URL(request.url)
          requestedDate = url.searchParams.get('date')
          return new HttpResponse(null, { status: 200 })
        }),
      )

      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      await act(async () => { await result.current.handleClockClick() })
      await act(async () => { await result.current.handleClockClick() })

      expect(requestedDate).toBe('2026-03-21')
      expect(result.current.status).toBe('idle')
    })

    it('초기화 시 ATTENDANCE_NOT_FOUND도 기록 없음으로 처리한다', async () => {
      server.use(
        http.delete('/api/v1/attendances/me', () =>
          HttpResponse.json(
            { code: 'ATTENDANCE_NOT_FOUND', message: '출근 기록을 찾을 수 없습니다.', data: null },
            { status: 404 },
          ),
        ),
      )

      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      await act(async () => { await result.current.handleClockClick() })
      await act(async () => { await result.current.handleClockClick() })

      expect(result.current.status).toBe('idle')
      expect(result.current.clockIn).toBeNull()
      expect(result.current.clockOut).toBeNull()
      expect(result.current.errorMessage).toBe('초기화할 출근 기록이 없습니다')
    })
  })

  describe('localStorage', () => {
    it('상태 변경 시 localStorage에 저장된다', async () => {
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      const stored = localStorage.getItem('yanus-work-session')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!).status).toBe('working')
    })

    it('서버에 오늘 기록이 없으면 이전 localStorage working 상태를 복구하지 않는다', async () => {
      localStorage.setItem('yanus-work-session', JSON.stringify({
        status: 'working',
        clockIn: `${getTodayStr()}T09:00:00.000Z`,
      }))

      const { result } = await mountHook()

      expect(result.current.status).toBe('idle')
      expect(result.current.clockIn).toBeNull()
      expect(localStorage.getItem('yanus-work-session')).toBeNull()
    })

    it('요청 실패 시에도 이전 날짜 localStorage 상태는 복구하지 않는다', async () => {
      server.use(
        http.get('/api/v1/attendances/me', () =>
          HttpResponse.json({ code: 'SERVER_ERROR', message: '서버 오류', data: null }, { status: 500 }),
        ),
      )
      localStorage.setItem('yanus-work-session', JSON.stringify({
        status: 'working',
        clockIn: '2026-03-21T09:00:00.000Z',
      }))

      const { result } = await mountHook()

      expect(result.current.status).toBe('idle')
      expect(result.current.clockIn).toBeNull()
    })

    it('요청 실패 시 오늘 localStorage 상태만 복구한다', async () => {
      server.use(
        http.get('/api/v1/attendances/me', () =>
          HttpResponse.json({ code: 'SERVER_ERROR', message: '서버 오류', data: null }, { status: 500 }),
        ),
      )
      localStorage.setItem('yanus-work-session', JSON.stringify({
        status: 'working',
        clockIn: `${getTodayStr()}T09:10:00.000Z`,
      }))

      const { result } = await mountHook()

      expect(result.current.status).toBe('working')
      expect(result.current.clockIn).not.toBeNull()
    })
  })

  describe('에러 처리', () => {
    it('ALREADY_CHECKED_IN: 이미 출근된 경우 서버 동기화 후 working 상태로 전환 및 info 메시지 설정', async () => {
      const { result } = await mountHook() // 초기 마운트는 기본 핸들러(빈 목록)로
      server.use(
        http.post('/api/v1/attendances/check-in', () =>
          HttpResponse.json(
            { code: 'ALREADY_CHECKED_IN', message: '이미 출근 처리되었습니다.', data: null },
            { status: 400 },
          ),
        ),
        http.get('/api/v1/attendances/me', () =>
          HttpResponse.json({
            code: 'SUCCESS', message: 'ok',
            data: [{ ...CLOCK_IN_RECORD, workDate: getTodayStr() }],
          }),
        ),
      )
      await act(async () => { await result.current.handleClockClick() })
      await act(async () => {}) // getMyAttendance() sync 완료 대기
      expect(result.current.status).toBe('working')
      expect(result.current.errorMessage).toBe('이미 출근 처리된 기록이 있습니다')
    })

    it('IP 제한 에러면 220.69 안내 메시지를 표시한다', async () => {
      server.use(
        http.post('/api/v1/attendances/check-in', () =>
          HttpResponse.json(
            { code: 'INVALID_ATTENDANCE_IP', message: '220.69 대역 IP만 출근 가능합니다.', data: null },
            { status: 403 },
          ),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() })
      expect(result.current.status).toBe('idle')
      expect(result.current.errorMessage).toBe('출근은 220.69 대역 IP에서만 가능합니다')
    })

    it('ALREADY_CHECKED_OUT: 이미 퇴근된 경우 done 상태 유지 및 info 메시지 설정', async () => {
      server.use(
        http.post('/api/v1/attendances/check-out', () =>
          HttpResponse.json(
            { code: 'ALREADY_CHECKED_OUT', message: '이미 퇴근 처리되었습니다.', data: null },
            { status: 400 },
          ),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle -> working
      await act(async () => { await result.current.handleClockClick() }) // working -> done (ALREADY_CHECKED_OUT)
      expect(result.current.status).toBe('done')
      expect(result.current.errorMessage).toBe('이미 퇴근 처리된 기록이 있습니다')
    })

    it('NOT_CHECKED_IN: 출근 기록 없이 퇴근 시 idle로 복구 및 에러 메시지 설정', async () => {
      server.use(
        http.post('/api/v1/attendances/check-out', () =>
          HttpResponse.json(
            { code: 'NOT_CHECKED_IN', message: '출근 기록이 없습니다.', data: null },
            { status: 400 },
          ),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle -> working
      await act(async () => { await result.current.handleClockClick() }) // working -> idle (NOT_CHECKED_IN)
      expect(result.current.status).toBe('idle')
      expect(result.current.errorMessage).toBe('출근 기록이 없습니다.')
    })

    it('INVALID_CHECKOUT_TIME: 잘못된 퇴근 시간 시 working 상태 복구 및 에러 메시지 설정', async () => {
      server.use(
        http.post('/api/v1/attendances/check-out', () =>
          HttpResponse.json(
            { code: 'INVALID_CHECKOUT_TIME', message: '퇴근 시간이 출근 시간보다 빠릅니다.', data: null },
            { status: 400 },
          ),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle -> working
      await act(async () => { await result.current.handleClockClick() }) // working -> working (rollback)
      expect(result.current.status).toBe('working')
      expect(result.current.errorMessage).toBe('퇴근 시간이 출근 시간보다 빠릅니다.')
    })

    it('clearError 호출 시 errorMessage가 null이 된다', async () => {
      server.use(
        http.post('/api/v1/attendances/check-out', () =>
          HttpResponse.json(
            { code: 'NOT_CHECKED_IN', message: '출근 기록이 없습니다.', data: null },
            { status: 400 },
          ),
        ),
      )
      const { result } = await mountHook()
      await act(async () => { await result.current.handleClockClick() }) // idle -> working
      await act(async () => { await result.current.handleClockClick() }) // working -> idle (NOT_CHECKED_IN)
      act(() => { result.current.clearError() })
      expect(result.current.errorMessage).toBeNull()
    })
  })
})
