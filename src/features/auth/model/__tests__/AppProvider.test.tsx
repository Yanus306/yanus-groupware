import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from '../AppProvider'
import type { User } from '../../../../entities/user/model/types'
import { FALLBACK_TEAMS } from '../../../../shared/lib/team'

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

    it('초기 users는 빈 배열이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.state.users).toEqual([])
    })

    it('초기 teams는 기본 팀 목록이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.state.teams).toEqual(FALLBACK_TEAMS)
    })
  })

  describe('권한 플래그', () => {
    it('currentUser가 없으면 isAdmin은 false이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isTeamLead).toBe(false)
    })

    it('loadUser로 ADMIN 역할을 로드하면 isAdmin은 true이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const leaderUser: User = { id: '1', name: '홍길동', email: 'admin@test.com', team: 'BACKEND', role: 'ADMIN', online: true }
      act(() => {
        result.current.loadUser(leaderUser)
      })
      expect(result.current.isAdmin).toBe(true)
    })

    it('loadUser로 member 역할을 로드하면 isAdmin은 false이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const memberUser: User = { id: '2', name: '김철수', email: 'user@test.com', team: 'BACKEND', role: 'MEMBER', online: true }
      act(() => {
        result.current.loadUser(memberUser)
      })
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isTeamLead).toBe(false)
    })

    it('loadUser로 TEAM_LEAD 역할을 로드하면 팀장 플래그만 true이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const teamLeadUser: User = { id: '3', name: '박팀장', email: 'lead@test.com', team: 'FRONTEND', role: 'TEAM_LEAD', online: true }
      act(() => {
        result.current.loadUser(teamLeadUser)
      })
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isTeamLead).toBe(true)
    })
  })

  describe('loadUser', () => {
    it('loadUser 호출 시 currentUser가 업데이트된다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const user: User = { id: '99', name: '테스트 유저', email: 'test@test.com', team: 'FRONTEND', role: 'MEMBER', online: true }
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
      const user: User = { id: '1', name: '홍길동', email: 'admin@test.com', team: 'BACKEND', role: 'ADMIN', online: true }
      act(() => {
        result.current.loadUser(user)
      })
      act(() => {
        result.current.logout()
      })
      expect(result.current.state.currentUser).toBeNull()
      expect(result.current.state.users).toEqual([])
      expect(result.current.state.teams).toEqual(FALLBACK_TEAMS)
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
