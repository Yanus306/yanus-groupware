import { useState } from 'react'
import { User, Bell, Palette, Shield, Save, Monitor, Moon, Sun } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { useTheme, type ThemeMode } from '../../shared/theme'
import { updateMyProfile } from '../../shared/api/membersApi'
import { Toast } from '../../shared/ui/Toast'
import './settings.css'

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security'

export function Settings() {
  const { state } = useApp()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [notifications, setNotifications] = useState({
    chat: true,
    calendar: true,
    attendance: false,
    email: true,
  })
  const [displayName, setDisplayName] = useState(state.currentUser?.name ?? '')
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const handleSave = async () => {
    try {
      await updateMyProfile({ name: displayName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '저장에 실패했습니다')
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    if (!newPassword) {
      setPasswordError('새 비밀번호를 입력해주세요')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다')
      return
    }
    try {
      await updateMyProfile({ password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 2000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다')
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: '프로필', icon: <User size={18} /> },
    { id: 'notifications', label: '알림', icon: <Bell size={18} /> },
    { id: 'appearance', label: '테마', icon: <Palette size={18} /> },
    { id: 'security', label: '보안', icon: <Shield size={18} /> },
  ]
  const themeOptions: { id: ThemeMode; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'light', label: '라이트 모드', description: '밝고 선명한 작업 환경', icon: <Sun size={18} /> },
    { id: 'dark', label: '다크 모드', description: '집중감을 높이는 어두운 화면', icon: <Moon size={18} /> },
  ]

  return (
    <div className="settings-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      <header className="settings-header">
        <div className="settings-header-copy">
          <p className="settings-kicker">환경 관리</p>
          <p className="settings-subtitle">프로필, 알림, 테마, 보안 환경을 한 곳에서 관리하세요.</p>
        </div>
        <div className="settings-summary-card glass">
          <div className="settings-summary-icon">
            <Monitor size={18} />
          </div>
          <div>
            <strong>{theme === 'dark' ? '다크 모드 사용 중' : '라이트 모드 사용 중'}</strong>
            <span>선택한 테마는 브라우저에 저장되어 다음 방문에도 유지됩니다.</span>
          </div>
        </div>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav glass">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="settings-content glass">
          {activeTab === 'profile' && (
            <section className="settings-section">
              <h3>프로필 정보</h3>
              <div className="profile-avatar-row">
                <div className="big-avatar">{(state.currentUser?.name?.[0] ?? '?')}</div>
                <div className="avatar-info">
                  <p className="avatar-name">{state.currentUser?.name ?? '-'}</p>
                  <p className="avatar-role">{state.currentUser?.role ?? '-'} · {state.currentUser?.team ?? '-'}</p>
                </div>
              </div>
              <div className="setting-field">
                <label>표시 이름</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="setting-input"
                />
              </div>
              <div className="setting-field">
                <label>역할</label>
                <input type="text" value={state.currentUser?.role ?? ''} disabled className="setting-input disabled" />
              </div>
              <div className="setting-field">
                <label>팀</label>
                <input type="text" value={state.currentUser?.team ?? ''} disabled className="setting-input disabled" />
              </div>
              <button className="save-btn" onClick={handleSave}>
                <Save size={16} />
                {saved ? '저장됨!' : '저장'}
              </button>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="settings-section">
              <h3>알림 설정</h3>
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="setting-row">
                  <div className="setting-row-info">
                    <span className="setting-row-label">
                      {key === 'chat' ? '채팅 알림' : key === 'calendar' ? '캘린더 알림' : key === 'attendance' ? '출퇴근 알림' : '이메일 알림'}
                    </span>
                    <span className="setting-row-desc">
                      {key === 'chat' ? '새 메시지가 오면 알려드립니다' : key === 'calendar' ? '일정 시작 전 알림' : key === 'attendance' ? '출퇴근 시간 리마인더' : '이메일로 중요 알림 수신'}
                    </span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'appearance' && (
            <section className="settings-section">
              <h3>테마 설정</h3>
              <div className="theme-options-grid">
                {themeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`theme-option-card ${theme === option.id ? 'active' : ''}`}
                    onClick={() => setTheme(option.id)}
                    aria-pressed={theme === option.id}
                  >
                    <div className="theme-option-header">
                      <span className="theme-option-icon">{option.icon}</span>
                      <div>
                        <strong>{option.label}</strong>
                        <p>{option.description}</p>
                      </div>
                    </div>
                    <div className={`theme-preview theme-preview-${option.id}`}>
                      <span className="theme-preview-chip" />
                      <span className="theme-preview-line short" />
                      <span className="theme-preview-line" />
                      <span className="theme-preview-line muted" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="appearance-note">
                <h4>테마 전환 안내</h4>
                <p>레이아웃, 카드, 입력창, 플로팅 UI까지 모두 선택한 테마에 맞춰 함께 전환됩니다.</p>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="settings-section">
              <h3>보안 설정</h3>
              <div className="setting-field">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  placeholder="현재 비밀번호 입력"
                  className="setting-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="setting-field">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 입력"
                  className="setting-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="setting-field">
                <label>비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  className="setting-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordError && (
                <p className="password-error">{passwordError}</p>
              )}
              <button className="save-btn" onClick={handlePasswordChange}>
                <Save size={16} />
                {passwordSaved ? '변경됨!' : '비밀번호 변경'}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
