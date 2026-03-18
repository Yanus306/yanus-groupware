import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import logoImg from '../assets/logo.png'
import './Login.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useApp()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    login(email, password)
    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-card glass">
        <div className="login-logo">
          <img src={logoImg} alt="yANUs" className="login-logo-img" />
          <h1 className="login-title">yANUs</h1>
          <p className="login-subtitle">동아리 그룹웨어</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>이메일</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
            />
          </div>

          <div className="login-field">
            <label>비밀번호</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn">로그인</button>
        </form>

        <p className="signup-hint">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="signup-link">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
