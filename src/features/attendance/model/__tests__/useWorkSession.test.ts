import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkSession } from '../useWorkSession'

describe('useWorkSession', () => {
  describe('초기 상태', () => {
    it('초기 상태는 idle이다', () => {
      const { result } = renderHook(() => useWorkSession())
      expect(result.current.status).toBe('idle')
    })

    it('초기 clockIn은 null이다', () => {
      const { result } = renderHook(() => useWorkSession())
      expect(result.current.clockIn).toBeNull()
    })

    it('초기 clockOut은 null이다', () => {
      const { result } = renderHook(() => useWorkSession())
      expect(result.current.clockOut).toBeNull()
    })
  })

  describe('출근 처리', () => {
    it('idle 상태에서 handleClockClick 호출 시 working 상태가 된다', () => {
      const { result } = renderHook(() => useWorkSession())
      act(() => {
        result.current.handleClockClick()
      })
      expect(result.current.status).toBe('working')
    })

    it('출근 시 clockIn이 설정된다', () => {
      const { result } = renderHook(() => useWorkSession())
      act(() => {
        result.current.handleClockClick()
      })
      expect(result.current.clockIn).not.toBeNull()
    })
  })

  describe('퇴근 처리', () => {
    it('working 상태에서 handleClockClick 호출 시 done 상태가 된다', () => {
      const { result } = renderHook(() => useWorkSession())
      act(() => { result.current.handleClockClick() }) // idle -> working
      act(() => { result.current.handleClockClick() }) // working -> done
      expect(result.current.status).toBe('done')
    })

    it('퇴근 시 clockOut이 설정된다', () => {
      const { result } = renderHook(() => useWorkSession())
      act(() => { result.current.handleClockClick() })
      act(() => { result.current.handleClockClick() })
      expect(result.current.clockOut).not.toBeNull()
    })
  })

  describe('재출근 처리', () => {
    it('done 상태에서 handleClockClick 호출 시 idle로 초기화된다', () => {
      const { result } = renderHook(() => useWorkSession())
      act(() => { result.current.handleClockClick() }) // idle -> working
      act(() => { result.current.handleClockClick() }) // working -> done
      act(() => { result.current.handleClockClick() }) // done -> idle
      expect(result.current.status).toBe('idle')
      expect(result.current.clockIn).toBeNull()
      expect(result.current.clockOut).toBeNull()
    })
  })

  describe('localStorage', () => {
    it('상태 변경 시 localStorage에 저장된다', () => {
      const { result } = renderHook(() => useWorkSession())
      act(() => {
        result.current.handleClockClick()
      })
      const stored = localStorage.getItem('yanus-work-session')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!).status).toBe('working')
    })
  })
})
