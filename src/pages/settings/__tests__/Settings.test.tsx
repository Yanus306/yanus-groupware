import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Settings } from '../index'

const mockUpdateMyProfile = vi.fn()

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: { currentUser: { id: '1', name: '홍길동', role: 'member', team: '개발팀' }, users: [] },
    isAdmin: false,
  }),
}))

vi.mock('../../../shared/api/membersApi', () => ({
  updateMyProfile: (...args: unknown[]) => mockUpdateMyProfile(...args),
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
})
