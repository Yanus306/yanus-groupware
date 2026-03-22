import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from '../AppProvider'
import type { PersonalWorkSchedule } from '../AppProvider'
import type { User } from '../../../../entities/user/model/types'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
)

describe('AppProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('초기 상태', () => {
    it('초기 currentUser는 null이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.state.currentUser).toBeNull()
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
    it('currentUser가 없으면 isAdmin은 false이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.isAdmin).toBe(false)
    })

    it('loadUser로 ADMIN 역할을 로드하면 isAdmin은 true이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const leaderUser: User = { id: '1', name: '홍길동', team: 'BACKEND', role: 'ADMIN', online: true }
      act(() => {
        result.current.loadUser(leaderUser)
      })
      expect(result.current.isAdmin).toBe(true)
    })

    it('loadUser로 member 역할을 로드하면 isAdmin은 false이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const memberUser: User = { id: '2', name: '김철수', team: 'BACKEND', role: 'MEMBER', online: true }
      act(() => {
        result.current.loadUser(memberUser)
      })
      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('loadUser', () => {
    it('loadUser 호출 시 currentUser가 업데이트된다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const user: User = { id: '99', name: '테스트 유저', team: 'FRONTEND', role: 'MEMBER', online: true }
      act(() => {
        result.current.loadUser(user)
      })
      expect(result.current.state.currentUser?.name).toBe('테스트 유저')
    })
  })

  describe('logout', () => {
    it('logout 호출 시 accessToken이 제거된다', () => {
      localStorage.setItem('accessToken', 'test-token')
      const { result } = renderHook(() => useApp(), { wrapper })
      act(() => {
        result.current.logout()
      })
      expect(localStorage.getItem('accessToken')).toBeNull()
    })

    it('logout 호출 시 currentUser가 null로 초기화된다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const user: User = { id: '1', name: '홍길동', team: 'BACKEND', role: 'ADMIN', online: true }
      act(() => {
        result.current.loadUser(user)
      })
      act(() => {
        result.current.logout()
      })
      expect(result.current.state.currentUser).toBeNull()
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
