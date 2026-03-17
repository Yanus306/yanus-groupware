import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from '../AppContext'
import type { PersonalWorkSchedule } from '../AppContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
)

describe('AppContext', () => {
  describe('초기 상태', () => {
    it('기본 사용자는 Alex Johnson이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.state.currentUser.name).toBe('Alex Johnson')
    })

    it('기본 사용자 목록은 5명이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.state.users).toHaveLength(5)
    })

    it('기본 근무 스케줄 출근 시간은 09:00이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.personalSchedule.checkInTime).toBe('09:00')
    })

    it('기본 근무 스케줄 퇴근 시간은 18:00이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.personalSchedule.checkOutTime).toBe('18:00')
    })

    it('기본 근무 요일은 월~금(5일)이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const workDays = result.current.personalSchedule.workDays
      expect(workDays.filter(Boolean)).toHaveLength(5)
    })
  })

  describe('isAdmin', () => {
    it('기본 사용자(leader 역할)는 관리자이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.isAdmin).toBe(true)
    })
  })

  describe('setPersonalSchedule', () => {
    it('근무 스케줄을 업데이트할 수 있다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const newSchedule: PersonalWorkSchedule = {
        workDays: [true, false, true, false, true, false, false],
        checkInTime: '10:00',
        checkOutTime: '19:00',
      }
      act(() => {
        result.current.setPersonalSchedule(newSchedule)
      })
      expect(result.current.personalSchedule.checkInTime).toBe('10:00')
      expect(result.current.personalSchedule.checkOutTime).toBe('19:00')
    })
  })

  describe('useApp 훅', () => {
    it('AppProvider 외부에서 useApp 호출 시 에러를 던진다', () => {
      expect(() => renderHook(() => useApp())).toThrow(
        'useApp must be used within AppProvider'
      )
    })
  })
})
