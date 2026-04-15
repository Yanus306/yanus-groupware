import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Settings } from '../index'

const mockUpdateMyProfile = vi.fn()
const mockDeactivateMember = vi.fn()
const mockGetMonthlyAttendanceSettlement = vi.fn()
const mockGetAutoCheckoutTime = vi.fn()
const mockUpdateAutoCheckoutTime = vi.fn()
const mockSetTheme = vi.fn()
const mockLogout = vi.fn()
const mockNavigate = vi.fn()
let currentUserRole: 'MEMBER' | 'ADMIN' = 'MEMBER'

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '1', name: '홍길동', role: currentUserRole, team: '1팀' },
      users: [],
      teams: [{ id: 1, name: '1팀' }],
    },
    isAdmin: currentUserRole === 'ADMIN',
    isTeamLead: false,
    logout: mockLogout,
  }),
}))

vi.mock('../../../shared/api/membersApi', () => ({
  updateMyProfile: (...args: unknown[]) => mockUpdateMyProfile(...args),
  deactivateMember: (...args: unknown[]) => mockDeactivateMember(...args),
}))

vi.mock('../../../shared/api/attendanceSettlementApi', () => ({
  getMonthlyAttendanceSettlement: (...args: unknown[]) => mockGetMonthlyAttendanceSettlement(...args),
}))

vi.mock('../../../shared/api/settingsApi', () => ({
  getAutoCheckoutTime: (...args: unknown[]) => mockGetAutoCheckoutTime(...args),
  updateAutoCheckoutTime: (...args: unknown[]) => mockUpdateAutoCheckoutTime(...args),
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
    currentUserRole = 'MEMBER'
    mockGetMonthlyAttendanceSettlement.mockResolvedValue({
      yearMonth: '2026-03',
      memberId: 1,
      memberName: '홍길동',
      teamName: '1팀',
      scheduledDays: 10,
      attendedDays: 9,
      lateDays: 2,
      totalLateMinutes: 12,
      lateFee: 1200,
      items: [
        {
          date: '2026-03-04',
          scheduledStartTime: '09:00:00',
          scheduledEndTime: '18:00:00',
          checkInTime: '2026-03-04T09:07:00',
          checkOutTime: '2026-03-04T18:02:00',
          lateMinutes: 7,
          fee: 700,
          status: 'LATE',
        },
      ],
    })
    mockGetAutoCheckoutTime.mockResolvedValue({
      autoCheckoutTime: '23:59:59',
    })
  })

  it('설정 페이지 설명이 렌더링된다', () => {
    render(<Settings />)
    expect(screen.getByText('프로필, 알림, 출퇴근, 테마, 정산, 보안 정보를 한 곳에서 관리하세요.')).toBeInTheDocument()
  })

  it('5개의 탭이 렌더링된다', () => {
    render(<Settings />)
    expect(screen.getByText('프로필')).toBeInTheDocument()
    expect(screen.getByText('알림')).toBeInTheDocument()
    expect(screen.getByText('출퇴근')).toBeInTheDocument()
    expect(screen.getByText('테마')).toBeInTheDocument()
    expect(screen.getByText('정산')).toBeInTheDocument()
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

  it('출퇴근 탭 클릭 시 자동 체크아웃 시간이 표시된다', async () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('출퇴근'))

    expect(await screen.findByText('자동 체크아웃 시간')).toBeInTheDocument()
    expect(mockGetAutoCheckoutTime).toHaveBeenCalled()
    expect(screen.getByDisplayValue('23:59:59')).toBeInTheDocument()
  })

  it('일반 멤버는 자동 체크아웃 시간을 읽기 전용으로 본다', async () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('출퇴근'))

    expect(await screen.findByText('관리자만 변경할 수 있습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '자동 체크아웃 시간 저장' })).not.toBeInTheDocument()
  })

  it('관리자는 자동 체크아웃 시간을 변경할 수 있다', async () => {
    currentUserRole = 'ADMIN'
    mockUpdateAutoCheckoutTime.mockResolvedValueOnce({
      autoCheckoutTime: '22:00:00',
    })

    render(<Settings />)
    fireEvent.click(screen.getByText('출퇴근'))

    await screen.findByDisplayValue('23:59:59')

    fireEvent.change(screen.getByLabelText('자동 체크아웃 시간 입력'), {
      target: { value: '22:00:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: '자동 체크아웃 시간 저장' }))

    await waitFor(() => {
      expect(mockUpdateAutoCheckoutTime).toHaveBeenCalledWith('22:00:00')
    })
    expect(screen.getByDisplayValue('22:00:00')).toBeInTheDocument()
  })

  it('정산 탭 클릭 시 개인 지각비 정산이 표시된다', async () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('정산'))

    expect(await screen.findByText('개인 지각비 정산')).toBeInTheDocument()
    expect(screen.getByText('1,200원')).toBeInTheDocument()
    expect(screen.getByText('2026-03-04')).toBeInTheDocument()
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
