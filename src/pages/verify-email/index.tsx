import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Mail, RotateCw } from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  const state = location.state as VerifyEmailLocationState | null
  const token = searchParams.get('token')?.trim() ?? ''
  const initialEmail = useMemo(
    () => state?.email ?? getPendingVerificationEmail(),
    [state?.email],
  )

  const [email, setEmail] = useState(initialEmail)
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>(token ? 'loading' : 'idle')
  const [verifyMessage, setVerifyMessage] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    ;(async () => {
      setVerifyStatus('loading')
      setVerifyMessage('')
      try {
        await verifyEmail(token)
        if (cancelled) return
        clearPendingVerificationEmail()
        setVerifyStatus('success')
        setVerifyMessage('이메일 인증이 완료되었습니다')
      } catch (error) {
        if (cancelled) return
        setVerifyStatus('error')
        setVerifyMessage(error instanceof Error ? error.message : '이메일 인증에 실패했습니다')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

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
            {verifyStatus === 'success' ? <CheckCircle2 size={22} /> : <Mail size={22} />}
          </div>

          {!token && (
            <>
              <h1>이메일을 확인해 주세요</h1>
              <p>
                회원가입이 거의 끝났습니다.
                <br />
                메일함에서 인증 링크를 눌러야 로그인할 수 있습니다.
              </p>
            </>
          )}

          {verifyStatus === 'loading' && (
            <>
              <h1>이메일 인증을 확인하고 있어요</h1>
              <p>잠시만 기다려 주세요. 인증 결과를 바로 안내해 드릴게요.</p>
            </>
          )}

          {token && verifyStatus === 'success' && (
            <>
              <h1>이메일 인증이 완료되었습니다</h1>
              <p>이제 로그인해서 서비스를 이용할 수 있습니다.</p>
            </>
          )}

          {token && verifyStatus === 'error' && (
            <>
              <h1>인증 링크를 확인할 수 없어요</h1>
              <p>{verifyMessage}</p>
            </>
          )}

          {!token && email && (
            <div className="verify-email-target">
              <span>인증 메일을 보낸 주소</span>
              <strong>{email}</strong>
            </div>
          )}

          {token && verifyStatus === 'success' && (
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
              아래 이메일로 인증 메일을 다시 보낼 수 있습니다.
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
