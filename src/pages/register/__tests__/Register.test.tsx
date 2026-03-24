import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../../../features/auth/model'
import { Register } from '../index'

vi.mock('../../../features/auth/api/authClient', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
}))

import { register, login, getMe } from '../../../features/auth/api/authClient'
const mockRegister = vi.mocked(register)
const mockLogin = vi.mocked(login)
const mockGetMe = vi.mocked(getMe)

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderRegister() {
  return render(
    <AppProvider>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('Register 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetMe.mockResolvedValue({ id: '4', name: '새사용자', email: 'new@yanus.kr', team: 'BACKEND', role: 'MEMBER', online: true })
    mockLogin.mockImplementation(async () => {
      localStorage.setItem('accessToken', 'mock-login-token')
      localStorage.setItem('refreshToken', 'mock-refresh-token')
      return 'mock-login-token'
    })
  })

  it('이름, 이메일, 팀, 비밀번호 필드와 회원가입 버튼이 렌더링된다', () => {
    renderRegister()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('팀')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()
  })

  it('필수값이 비어 있으면 유효성 에러를 표시한다', async () => {
    renderRegister()
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))
    expect(await screen.findByText('이름을 입력해 주세요')).toBeInTheDocument()
    expect(screen.getByText('이메일을 입력해 주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해 주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호 확인을 입력해 주세요')).toBeInTheDocument()
    expect(screen.getByLabelText('팀')).toHaveClass('error')
  })

  it('비밀번호 확인이 다르면 에러를 표시한다', async () => {
    renderRegister()
    await userEvent.type(screen.getByLabelText('이름'), '홍길동')
    await userEvent.type(screen.getByLabelText('이메일'), 'user@test.com')
    await userEvent.selectOptions(screen.getByLabelText('팀'), 'BACKEND')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password456')
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))
    expect(await screen.findByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
  })

  it('회원가입 성공 시 accessToken을 저장하고 홈으로 이동한다', async () => {
    mockRegister.mockResolvedValue(undefined)
    renderRegister()
    await userEvent.type(screen.getByLabelText('이름'), '홍길동')
    await userEvent.type(screen.getByLabelText('이메일'), 'user@test.com')
    await userEvent.selectOptions(screen.getByLabelText('팀'), 'BACKEND')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))
    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('mock-login-token')
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('회원가입 실패 시 에러 메시지를 표시한다', async () => {
    mockRegister.mockRejectedValue(new Error('이미 가입된 이메일입니다'))
    renderRegister()
    await userEvent.type(screen.getByLabelText('이름'), '홍길동')
    await userEvent.type(screen.getByLabelText('이메일'), 'admin@yanus.kr')
    await userEvent.selectOptions(screen.getByLabelText('팀'), 'BACKEND')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))
    expect(await screen.findByText('이미 가입된 이메일입니다')).toBeInTheDocument()
  })
})
