import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { login, getMe } from '../../features/auth/api/authClient'
import { useApp } from '../../features/auth/model'
import { consumeSessionExpiredMessage } from '../../shared/lib/authStorage'
import { setPendingVerificationEmail } from '../../shared/lib/emailVerification'
import logoSrc from '../../assets/logo.png'
import './login.css'

const EMAIL_NOT_VERIFIED_MESSAGE = '이메일 인증을 완료한 뒤 로그인해 주세요'

interface FormErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email.trim()) {
    errors.email = '이메일을 입력해 주세요'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '올바른 이메일 형식을 입력해 주세요'
  }
  if (!password) {
    errors.password = '비밀번호를 입력해 주세요'
  }
  return errors
}

export function Login() {
  const navigate = useNavigate()
  const { loadUser } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const expiredMessage = consumeSessionExpiredMessage()
    if (expiredMessage) {
      setServerError(expiredMessage)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(email, password)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    setLoading(true)
    try {
      await login(email, password)
      const user = await getMe()
      loadUser(user)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다'
      if (message === EMAIL_NOT_VERIFIED_MESSAGE) {
        setPendingVerificationEmail(email)
        navigate('/verify-email', {
          state: { email },
        })
        return
      }

      setServerError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card glass">
        <div className="login-logo">
          <img src={logoSrc} alt="yANUs" className="login-logo-img" />
          <span className="login-logo-title">yANUs</span>
          <span className="login-logo-sub">동아리 그룹웨어</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="login-error" role="alert">
              <AlertCircle size={16} />
              {serverError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div className="input-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                className={`form-input${errors.email ? ' error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`form-input${errors.password ? ' error' : ''}`}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <span className="login-btn-inner">
              {loading && <span className="spinner" />}
              로그인
            </span>
          </button>
        </form>

        <div className="login-footer">
          아직 계정이 없으신가요? <Link to="/register">회원가입</Link>
        </div>
      </div>
    </div>
  )
}
