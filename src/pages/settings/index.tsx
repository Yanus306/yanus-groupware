import { useState } from 'react'
import { User, Bell, Palette, Shield, Save } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { updateMyProfile } from '../../shared/api/membersApi'
import { Toast } from '../../shared/ui/Toast'
import './settings.css'

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security'

export function Settings() {
  const { state } = useApp()
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

  const handleSave = async () => {
    try {
      await updateMyProfile({ name: displayName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '저장에 실패했습니다')
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: '프로필', icon: <User size={18} /> },
    { id: 'notifications', label: '알림', icon: <Bell size={18} /> },
    { id: 'appearance', label: '테마', icon: <Palette size={18} /> },
    { id: 'security', label: '보안', icon: <Shield size={18} /> },
  ]

  return (
    <div className="settings-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      <header className="settings-header">
        <h1>설정</h1>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav glass">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
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
              <div className="setting-row">
                <div className="setting-row-info">
                  <span className="setting-row-label">다크 모드</span>
                  <span className="setting-row-desc">현재 yANUs는 다크 모드만 지원합니다</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked disabled />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="color-swatches">
                <h4>액센트 컬러</h4>
                <div className="swatches-row">
                  {['#9680cc', '#72b8e8', '#d44a99', '#22c55e', '#f59e0b'].map((color) => (
                    <button
                      key={color}
                      className="swatch"
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="settings-section">
              <h3>보안 설정</h3>
              <div className="setting-field">
                <label>현재 비밀번호</label>
                <input type="password" placeholder="••••••••" className="setting-input" />
              </div>
              <div className="setting-field">
                <label>새 비밀번호</label>
                <input type="password" placeholder="••••••••" className="setting-input" />
              </div>
              <div className="setting-field">
                <label>비밀번호 확인</label>
                <input type="password" placeholder="••••••••" className="setting-input" />
              </div>
              <button className="save-btn" onClick={handleSave}>
                <Save size={16} />
                {saved ? '변경됨!' : '비밀번호 변경'}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
