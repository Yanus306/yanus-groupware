import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User as UserIcon, Mail, Lock, Eye, EyeOff, AlertCircle, Users } from 'lucide-react'
import { getMe, register } from '../../features/auth/api/authClient'
import { useApp } from '../../features/auth/model'
import type { User } from '../../entities/user/model/types'
import logoSrc from '../../assets/logo.png'
import './register.css'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  team?: string
}

const teams: Array<{ value: User['team']; label: string }> = [
  { value: 'BACKEND', label: '백엔드팀' },
  { value: 'FRONTEND', label: '프론트엔드팀' },
  { value: 'AI', label: 'AI팀' },
  { value: 'SECURITY', label: '보안팀' },
]

function validate(name: string, email: string, password: string, confirmPassword: string, team: string): FormErrors {
  const errors: FormErrors = {}
  if (!name.trim()) {
    errors.name = '이름을 입력해 주세요'
  }
  if (!email.trim()) {
    errors.email = '이메일을 입력해 주세요'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '올바른 이메일 형식을 입력해 주세요'
  }
  if (!password) {
    errors.password = '비밀번호를 입력해 주세요'
  } else if (password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다'
  }
  if (!confirmPassword) {
    errors.confirmPassword = '비밀번호 확인을 입력해 주세요'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다'
  }
  if (!team) {
    errors.team = '팀을 선택해 주세요'
  }
  return errors
}

export function Register() {
  const navigate = useNavigate()
  const { loadUser } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [team, setTeam] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(name, email, password, confirmPassword, team)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    setLoading(true)
    try {
      const token = await register({ name, email, password, team: team as User['team'] })
      localStorage.setItem('accessToken', token)
      const user = await getMe()
      loadUser(user)
      navigate('/')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card glass">
        <div className="register-logo">
          <img src={logoSrc} alt="yANUs" className="register-logo-img" />
          <span className="register-logo-title">yANUs</span>
          <span className="register-logo-sub">새 계정을 만들어 시작해 보세요</span>
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="register-error" role="alert">
              <AlertCircle size={16} />
              {serverError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">이름</label>
            <div className="input-wrap">
              <UserIcon size={16} className="input-icon" />
              <input
                id="name"
                type="text"
                className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

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
            <label htmlFor="team">팀</label>
            <div className="input-wrap">
              <Users size={16} className="input-icon" />
              <select
                id="team"
                className={`form-input form-select${errors.team ? ' error' : ''}`}
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option value="">팀을 선택해 주세요</option>
                {teams.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.team && <span className="field-error">{errors.team}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`form-input${errors.password ? ' error' : ''}`}
                placeholder="8자 이상 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPw ? 'text' : 'password'}
                className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowConfirmPw((v) => !v)}
                aria-label={showConfirmPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            <span className="register-btn-inner">
              {loading && <span className="spinner" />}
              회원가입
            </span>
          </button>
        </form>

        <div className="register-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  )
}
