import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../../../features/auth/model'
import { Login } from '../index'

vi.mock('../../../features/auth/api/authClient', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
}))

import { login, getMe } from '../../../features/auth/api/authClient'
const mockLogin = vi.mocked(login)
const mockGetMe = vi.mocked(getMe)

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  return render(
    <AppProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('Login 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetMe.mockResolvedValue({ id: '1', name: '홍길동', email: 'user@test.com', team: 'BACKEND', role: 'MEMBER', online: true })
  })

  it('이메일, 비밀번호 입력 필드와 로그인 버튼이 렌더링된다', () => {
    renderLogin()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('이메일이 비어있으면 유효성 에러를 표시한다', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('이메일을 입력해 주세요')).toBeInTheDocument()
  })

  it('비밀번호가 비어있으면 유효성 에러를 표시한다', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText('이메일'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('비밀번호를 입력해 주세요')).toBeInTheDocument()
  })

  it('이메일 형식이 올바르지 않으면 에러를 표시한다', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText('이메일'), 'invalid-email')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('올바른 이메일 형식을 입력해 주세요')).toBeInTheDocument()
  })

  it('로그인 성공 시 accessToken을 localStorage에 저장하고 /로 이동한다', async () => {
    mockLogin.mockImplementation(async () => {
      localStorage.setItem('accessToken', 'real-token')
      localStorage.setItem('refreshToken', 'real-refresh-token')
      return 'real-token'
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText('이메일'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('real-token')
      expect(localStorage.getItem('refreshToken')).toBe('real-refresh-token')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('로그인 실패 시 에러 메시지를 표시한다', async () => {
    mockLogin.mockRejectedValue(new Error('이메일 또는 비밀번호가 올바르지 않습니다'))
    renderLogin()
    await userEvent.type(screen.getByLabelText('이메일'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument()
  })

  it('비활성 계정이면 전용 안내 메시지를 표시한다', async () => {
    mockLogin.mockRejectedValue(new Error('비활성화된 계정입니다. 관리자에게 문의해 주세요'))
    renderLogin()
    await userEvent.type(screen.getByLabelText('이메일'), 'inactive@yanus.kr')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('비활성화된 계정입니다. 관리자에게 문의해 주세요')).toBeInTheDocument()
  })

  it('로딩 중에는 버튼이 비활성화된다', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})) // 무한 대기
    renderLogin()
    await userEvent.type(screen.getByLabelText('이메일'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(screen.getByRole('button', { name: /로그인/ })).toBeDisabled()
  })
})
