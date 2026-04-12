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
    expect(screen.getByLabelText('인증 코드')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증 확인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증 메일 다시 보내기' })).toBeInTheDocument()
  })

  it('인증 코드를 입력하고 확인하면 성공 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    mockVerifyEmail.mockResolvedValue(undefined)

    renderVerifyEmail([{ pathname: '/verify-email', state: { email: 'user@test.com' } }])

    await user.type(screen.getByLabelText('인증 코드'), 'valid-token')
    await user.click(screen.getByRole('button', { name: '인증 확인' }))

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token')
    })
    expect(await screen.findByText('이메일 인증이 완료되었습니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하러 가기' })).toBeInTheDocument()
  })

  it('인증 코드가 비어 있으면 안내 문구를 표시한다', async () => {
    const user = userEvent.setup()

    renderVerifyEmail([{ pathname: '/verify-email', state: { email: 'user@test.com' } }])

    await user.click(screen.getByRole('button', { name: '인증 확인' }))

    expect(await screen.findByText('인증 코드를 입력해 주세요')).toBeInTheDocument()
    expect(mockVerifyEmail).not.toHaveBeenCalled()
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
