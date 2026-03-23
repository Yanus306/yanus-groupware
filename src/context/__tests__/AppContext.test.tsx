import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from '../AppContext'
import type { User } from '../../entities/user/model/types'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
)

describe('AppContext', () => {
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
      expect(result.current.state.users).toHaveLength(0)
    })
  })

  describe('isAdmin', () => {
    it('로그인 전 isAdmin은 false이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      expect(result.current.isAdmin).toBe(false)
    })

    it('ADMIN 역할 사용자 로드 시 isAdmin은 true이다', () => {
      const { result } = renderHook(() => useApp(), { wrapper })
      const leaderUser: User = { id: '1', name: '홍길동', email: 'admin@test.com', team: 'BACKEND', role: 'ADMIN', online: true }
      act(() => {
        result.current.loadUser(leaderUser)
      })
      expect(result.current.isAdmin).toBe(true)
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
