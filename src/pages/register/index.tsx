import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User as UserIcon, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { getMe, login, register } from '../../features/auth/api/authClient'
import { useApp } from '../../features/auth/model'
import { getTeams } from '../../shared/api/teamsApi'
import type { TeamResponse } from '../../shared/api/teamsApi'
import {
  DEFAULT_SIGNUP_TEAM_NAME,
  FALLBACK_TEAMS,
  cacheTeams,
  getCachedTeams,
  getDefaultSignupTeam,
  sortTeams,
} from '../../shared/lib/team'
import logoSrc from '../../assets/logo.png'
import './register.css'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validate(name: string, email: string, password: string, confirmPassword: string): FormErrors {
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
  return errors
}

export function Register() {
  const navigate = useNavigate()
  const { loadUser } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [teamOptions, setTeamOptions] = useState<TeamResponse[]>([])
  const [teamSource, setTeamSource] = useState<'live' | 'cached' | 'fallback'>('live')
  const defaultTeam = getDefaultSignupTeam(teamOptions)

  useEffect(() => {
    getTeams()
      .then((teams) => {
        const sortedTeams = sortTeams(teams)
        cacheTeams(sortedTeams)
        setTeamOptions(sortedTeams)
        setTeamSource('live')
      })
      .catch(() => {
        const cachedTeams = getCachedTeams()
        if (cachedTeams.length > 0) {
          setTeamOptions(cachedTeams)
          setTeamSource('cached')
          return
        }

        setTeamOptions(FALLBACK_TEAMS)
        setTeamSource('fallback')
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(name, email, password, confirmPassword)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    if (!defaultTeam) {
      setServerError(`기본 팀 ${DEFAULT_SIGNUP_TEAM_NAME}을 찾을 수 없습니다. 관리자에게 문의해 주세요`)
      return
    }

    setLoading(true)
    try {
      await register({ name, email, password, teamId: defaultTeam.id })
      await login(email, password)
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
              <input
                id="team"
                type="text"
                className="form-input"
                value={defaultTeam?.name ?? DEFAULT_SIGNUP_TEAM_NAME}
                readOnly
              />
            </div>
            <span className="field-help">회원가입 시 모든 신규 사용자는 신입 팀으로 자동 배정됩니다.</span>
            {teamSource !== 'live' && (
              <span className="field-help">
                {teamSource === 'cached'
                  ? '실시간 팀 목록을 불러오지 못해 최근 저장된 팀 목록을 표시 중입니다.'
                  : '실시간 팀 목록을 불러오지 못해 기본 팀 목록을 표시 중입니다. 최신 팀이 보이지 않으면 관리자에게 문의해 주세요.'}
              </span>
            )}
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
