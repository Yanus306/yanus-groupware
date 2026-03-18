import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Settings } from '../index'

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: { currentUser: { id: '1', name: '홍길동', role: 'member', team: '개발팀' }, users: [] },
    isAdmin: false,
  }),
}))

describe('Settings 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('설정 페이지 제목이 렌더링된다', () => {
    render(<Settings />)
    expect(screen.getByText('설정')).toBeInTheDocument()
  })

  it('4개의 탭이 렌더링된다', () => {
    render(<Settings />)
    expect(screen.getByText('프로필')).toBeInTheDocument()
    expect(screen.getByText('알림')).toBeInTheDocument()
    expect(screen.getByText('테마')).toBeInTheDocument()
    expect(screen.getByText('보안')).toBeInTheDocument()
  })

  it('기본으로 프로필 탭이 활성화된다', () => {
    render(<Settings />)
    expect(screen.getByText('프로필 정보')).toBeInTheDocument()
  })

  it('알림 탭 클릭 시 알림 설정이 표시된다', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('알림'))
    expect(screen.getByText('채팅 알림')).toBeInTheDocument()
  })

  it('보안 탭 클릭 시 비밀번호 변경 섹션이 표시된다', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('보안'))
    expect(screen.getByText('비밀번호 변경')).toBeInTheDocument()
  })
})
