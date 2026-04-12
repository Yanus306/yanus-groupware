import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { VerifyEmail } from '../index'

vi.mock('../../../features/auth/api/authClient', () => ({
  verifyEmail: vi.fn(),
  resendVerificationEmail: vi.fn(),
}))

import { verifyEmail, resendVerificationEmail } from '../../../features/auth/api/authClient'

const mockVerifyEmail = vi.mocked(verifyEmail)
const mockResendVerificationEmail = vi.mocked(resendVerificationEmail)

function renderVerifyEmail(initialEntries: Array<string | { pathname: string; search?: string; state?: unknown }>) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VerifyEmail 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('회원가입 직후 진입하면 이메일 인증 안내와 재전송 버튼을 표시한다', () => {
    renderVerifyEmail([{ pathname: '/verify-email', state: { email: 'user@test.com' } }])

    expect(screen.getByText('이메일을 확인해 주세요')).toBeInTheDocument()
    expect(screen.getByDisplayValue('user@test.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증 메일 다시 보내기' })).toBeInTheDocument()
  })

  it('토큰이 있으면 자동으로 이메일 인증을 시도하고 성공 메시지를 표시한다', async () => {
    mockVerifyEmail.mockResolvedValue(undefined)

    renderVerifyEmail(['/verify-email?token=valid-token'])

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token')
    })

    expect(await screen.findByText('이메일 인증이 완료되었습니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하러 가기' })).toBeInTheDocument()
  })

  it('이메일 인증 메일 재전송 요청이 가능하다', async () => {
    const user = userEvent.setup()
    mockResendVerificationEmail.mockResolvedValue(undefined)

    renderVerifyEmail([{ pathname: '/verify-email', state: { email: 'user@test.com' } }])

    await user.click(screen.getByRole('button', { name: '인증 메일 다시 보내기' }))

    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('user@test.com')
    })

    expect(await screen.findByText('인증 메일을 다시 보냈습니다. 메일함을 확인해 주세요')).toBeInTheDocument()
  })
})
