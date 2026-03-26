import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Settings } from '../index'

const mockUpdateMyProfile = vi.fn()
const mockDeactivateMember = vi.fn()
const mockSetTheme = vi.fn()
const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '1', name: '홍길동', role: 'MEMBER', team: '1팀' },
      users: [],
      teams: [{ id: 1, name: '1팀' }],
    },
    isAdmin: false,
    isTeamLead: false,
    logout: mockLogout,
  }),
}))

vi.mock('../../../shared/api/membersApi', () => ({
  updateMyProfile: (...args: unknown[]) => mockUpdateMyProfile(...args),
  deactivateMember: (...args: unknown[]) => mockDeactivateMember(...args),
}))

vi.mock('../../../shared/theme', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: mockSetTheme,
    toggleTheme: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Settings 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('설정 페이지 설명이 렌더링된다', () => {
    render(<Settings />)
    expect(screen.getByText('프로필, 알림, 테마, 보안 환경을 한 곳에서 관리하세요.')).toBeInTheDocument()
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

  it('테마 카드 클릭 시 setTheme가 호출된다', () => {
    render(<Settings />)

    fireEvent.click(screen.getByText('테마'))
    fireEvent.click(screen.getByRole('button', { name: /라이트 모드/ }))

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  describe('비밀번호 변경', () => {
    it('새 비밀번호와 확인이 일치하지 않으면 에러 메시지가 표시된다', async () => {
      render(<Settings />)
      fireEvent.click(screen.getByText('보안'))

      fireEvent.change(screen.getByPlaceholderText('현재 비밀번호 입력'), { target: { value: 'old1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 입력'), { target: { value: 'new1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 확인'), { target: { value: 'different!' } })
      fireEvent.click(screen.getByRole('button', { name: /비밀번호 변경/ }))

      await waitFor(() => {
        expect(screen.getByText('새 비밀번호가 일치하지 않습니다')).toBeInTheDocument()
      })
      expect(mockUpdateMyProfile).not.toHaveBeenCalled()
    })

    it('새 비밀번호가 비어있으면 에러 메시지가 표시된다', async () => {
      render(<Settings />)
      fireEvent.click(screen.getByText('보안'))

      fireEvent.change(screen.getByPlaceholderText('현재 비밀번호 입력'), { target: { value: 'old1234!' } })
      fireEvent.click(screen.getByRole('button', { name: /비밀번호 변경/ }))

      await waitFor(() => {
        expect(screen.getByText('새 비밀번호를 입력해주세요')).toBeInTheDocument()
      })
      expect(mockUpdateMyProfile).not.toHaveBeenCalled()
    })

    it('유효한 입력 시 updateMyProfile이 password와 함께 호출된다', async () => {
      mockUpdateMyProfile.mockResolvedValueOnce(null)
      render(<Settings />)
      fireEvent.click(screen.getByText('보안'))

      fireEvent.change(screen.getByPlaceholderText('현재 비밀번호 입력'), { target: { value: 'old1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 입력'), { target: { value: 'new1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 확인'), { target: { value: 'new1234!' } })
      fireEvent.click(screen.getByRole('button', { name: /비밀번호 변경/ }))

      await waitFor(() => {
        expect(mockUpdateMyProfile).toHaveBeenCalledWith({
          password: 'new1234!',
        })
      })
    })

    it('변경 성공 시 입력 필드가 초기화된다', async () => {
      mockUpdateMyProfile.mockResolvedValueOnce(null)
      render(<Settings />)
      fireEvent.click(screen.getByText('보안'))

      fireEvent.change(screen.getByPlaceholderText('현재 비밀번호 입력'), { target: { value: 'old1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 입력'), { target: { value: 'new1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 확인'), { target: { value: 'new1234!' } })
      fireEvent.click(screen.getByRole('button', { name: /비밀번호 변경/ }))

      await waitFor(() => {
        expect((screen.getByPlaceholderText('현재 비밀번호 입력') as HTMLInputElement).value).toBe('')
        expect((screen.getByPlaceholderText('새 비밀번호 입력') as HTMLInputElement).value).toBe('')
        expect((screen.getByPlaceholderText('새 비밀번호 확인') as HTMLInputElement).value).toBe('')
      })
    })

    it('API 실패 시 에러 토스트가 표시된다', async () => {
      mockUpdateMyProfile.mockRejectedValueOnce(new Error('서버 오류'))
      render(<Settings />)
      fireEvent.click(screen.getByText('보안'))

      fireEvent.change(screen.getByPlaceholderText('현재 비밀번호 입력'), { target: { value: 'old1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 입력'), { target: { value: 'new1234!' } })
      fireEvent.change(screen.getByPlaceholderText('새 비밀번호 확인'), { target: { value: 'new1234!' } })
      fireEvent.click(screen.getByRole('button', { name: /비밀번호 변경/ }))

      await waitFor(() => {
        expect(screen.getByText('서버 오류')).toBeInTheDocument()
      })
    })
  })

  describe('회원 탈퇴', () => {
    it('회원 탈퇴 확인 후 deactivateMember와 logout이 호출된다', async () => {
      mockDeactivateMember.mockResolvedValueOnce(null)

      render(<Settings />)
      fireEvent.click(screen.getByText('보안'))
      fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
      fireEvent.click(screen.getByRole('button', { name: '탈퇴 진행' }))

      await waitFor(() => {
        expect(mockDeactivateMember).toHaveBeenCalledWith('1')
        expect(mockLogout).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
      })
    })
  })
})
