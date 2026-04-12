import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle2, KeyRound, RotateCw } from 'lucide-react'
import { resendVerificationEmail, verifyEmail } from '../../features/auth/api/authClient'
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  setPendingVerificationEmail,
} from '../../shared/lib/emailVerification'
import logoSrc from '../../assets/logo.png'
import './verify-email.css'

type VerifyStatus = 'idle' | 'loading' | 'success' | 'error'

interface VerifyEmailLocationState {
  email?: string
}

export function VerifyEmail() {
  const location = useLocation()
  const state = location.state as VerifyEmailLocationState | null
  const initialEmail = useMemo(
    () => state?.email ?? getPendingVerificationEmail(),
    [state?.email],
  )

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [verifyMessage, setVerifyMessage] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')
  const [resending, setResending] = useState(false)

  const handleVerify = async () => {
    const trimmedCode = code.trim()
    setVerifyMessage('')

    if (!trimmedCode) {
      setVerifyStatus('error')
      setVerifyMessage('인증 코드를 입력해 주세요')
      return
    }

    setVerifyStatus('loading')
    try {
      await verifyEmail(trimmedCode)
      clearPendingVerificationEmail()
      setVerifyStatus('success')
      setVerifyMessage('이메일 인증이 완료되었습니다')
    } catch (error) {
      setVerifyStatus('error')
      setVerifyMessage(error instanceof Error ? error.message : '이메일 인증에 실패했습니다')
    }
  }

  const handleResend = async () => {
    const trimmedEmail = email.trim()
    setResendMessage('')

    if (!trimmedEmail) {
      setResendError('이메일을 입력해 주세요')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setResendError('올바른 이메일 형식을 입력해 주세요')
      return
    }

    setResendError('')
    setResending(true)

    try {
      await resendVerificationEmail(trimmedEmail)
      setPendingVerificationEmail(trimmedEmail)
      setResendMessage('인증 메일을 다시 보냈습니다. 메일함을 확인해 주세요')
    } catch (error) {
      setResendError(error instanceof Error ? error.message : '인증 메일 재전송에 실패했습니다')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="verify-email-page">
      <div className="verify-email-card glass">
        <div className="verify-email-logo">
          <img src={logoSrc} alt="yANUs" className="verify-email-logo-img" />
          <span className="verify-email-logo-title">yANUs</span>
          <span className="verify-email-logo-sub">이메일 인증</span>
        </div>

        <div className="verify-email-status-card">
          <div className={`verify-email-status-icon ${verifyStatus}`}>
            {verifyStatus === 'success' ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}
          </div>

          {verifyStatus !== 'success' && (
            <>
              <h1>이메일을 확인해 주세요</h1>
              <p>
                회원가입이 거의 끝났습니다.
                <br />
                메일로 받은 인증 코드를 입력해야 로그인할 수 있습니다.
              </p>
            </>
          )}

          {verifyStatus === 'loading' && (
            <>
              <h1>인증 코드를 확인하고 있어요</h1>
              <p>잠시만 기다려 주세요. 입력한 코드를 바로 확인해 드릴게요.</p>
            </>
          )}

          {verifyStatus === 'success' && (
            <>
              <h1>이메일 인증이 완료되었습니다</h1>
              <p>이제 로그인해서 서비스를 이용할 수 있습니다.</p>
            </>
          )}

          {email && verifyStatus !== 'success' && (
            <div className="verify-email-target">
              <span>인증 메일을 보낸 주소</span>
              <strong>{email}</strong>
            </div>
          )}

          {verifyStatus !== 'success' && (
            <div className="verify-email-input-group">
              <label htmlFor="verification-code">인증 코드</label>
              <input
                id="verification-code"
                type="text"
                className={`verify-email-input ${verifyStatus === 'error' ? 'error' : ''}`}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="메일로 받은 인증 코드를 입력해 주세요"
                autoComplete="one-time-code"
              />
              {verifyStatus === 'error' && verifyMessage && (
                <div className="verify-email-feedback error" role="alert">
                  <AlertCircle size={16} />
                  {verifyMessage}
                </div>
              )}
            </div>
          )}

          {verifyStatus !== 'success' && (
            <button
              type="button"
              className="verify-email-primary-link verify-email-primary-btn"
              onClick={handleVerify}
              disabled={verifyStatus === 'loading'}
            >
              {verifyStatus === 'loading' ? '확인 중...' : '인증 확인'}
            </button>
          )}

          {verifyStatus === 'success' && (
            <Link to="/login" className="verify-email-primary-link">
              로그인하러 가기
            </Link>
          )}
        </div>

        {verifyStatus !== 'success' && (
          <div className="verify-email-resend">
            <div className="verify-email-resend-head">
              <RotateCw size={16} />
              <span>메일을 받지 못하셨나요?</span>
            </div>
            <p className="verify-email-resend-copy">
              아래 이메일로 인증 코드를 다시 받을 수 있습니다.
            </p>

            <div className="verify-email-input-group">
              <label htmlFor="resend-email">이메일</label>
              <input
                id="resend-email"
                type="email"
                className={`verify-email-input ${resendError ? 'error' : ''}`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
              {resendError && (
                <div className="verify-email-feedback error" role="alert">
                  <AlertCircle size={16} />
                  {resendError}
                </div>
              )}
              {resendMessage && (
                <div className="verify-email-feedback success">
                  <CheckCircle2 size={16} />
                  {resendMessage}
                </div>
              )}
            </div>

            <button
              type="button"
              className="verify-email-resend-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? '전송 중...' : '인증 메일 다시 보내기'}
            </button>
          </div>
        )}

        <div className="verify-email-footer">
          이미 인증을 마치셨나요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  )
}
