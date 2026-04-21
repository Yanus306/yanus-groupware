import { useEffect, useState } from 'react'
import { User, Bell, Palette, Shield, Save, Monitor, Moon, Sun, AlertTriangle, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../features/auth/model'
import { useTheme, type ThemeMode } from '../../shared/theme'
import { updateMyProfile, deactivateMember } from '../../shared/api/membersApi'
import { getMonthlyAttendanceSettlement } from '../../shared/api/attendanceSettlementApi'
import type { AttendanceSettlement } from '../../shared/api/attendanceSettlementApi'
import { formatScheduleRangeLabel } from '../../shared/lib/attendanceSchedule'
import { Toast } from '../../shared/ui/Toast'
import './settings.css'

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security' | 'settlement'

const SETTINGS_SECTION_META: Record<
  SettingsTab,
  { eyebrow: string; title: string; description: string; badge: string }
> = {
  profile: {
    eyebrow: 'Profile',
    title: '내 계정과 소속 정보를 정리합니다.',
    description: '표시 이름, 역할, 팀 정보를 확인하고 개인 프로필을 안전하게 관리할 수 있습니다.',
    badge: '계정 기본 정보',
  },
  notifications: {
    eyebrow: 'Notifications',
    title: '어떤 알림을 받을지 직접 고릅니다.',
    description: '채팅, 캘린더, 이메일 알림을 역할에 맞게 조절해 방해를 줄입니다.',
    badge: '알림 제어',
  },
  appearance: {
    eyebrow: 'Appearance',
    title: '작업 환경에 맞는 화면 분위기를 고릅니다.',
    description: '라이트 모드와 다크 모드를 전환해 집중하기 좋은 화면을 유지합니다.',
    badge: '테마 설정',
  },
  settlement: {
    eyebrow: 'Settlement',
    title: '내 지각비와 출근 기록을 빠르게 확인합니다.',
    description: '월별 정산 결과와 상세 내역을 한 번에 보면서 누락이나 지각을 바로 점검할 수 있습니다.',
    badge: '개인 정산',
  },
  security: {
    eyebrow: 'Security',
    title: '비밀번호와 계정 상태를 안전하게 관리합니다.',
    description: '비밀번호 변경과 탈퇴 같은 민감한 작업을 한 곳에서 처리해 계정 통제를 단순하게 만듭니다.',
    badge: '보안 관리',
  },
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function Settings() {
  const navigate = useNavigate()
  const { state, logout } = useApp()
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
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [selectedSettlementMonth, setSelectedSettlementMonth] = useState(new Date().toISOString().slice(0, 7))
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [settlement, setSettlement] = useState<AttendanceSettlement | null>(null)

  useEffect(() => {
    if (activeTab !== 'settlement') return

    setSettlementLoading(true)
    getMonthlyAttendanceSettlement(selectedSettlementMonth)
      .then((data) => {
        setSettlement(data)
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : '개인 지각비 정산을 불러오지 못했습니다')
      })
      .finally(() => {
        setSettlementLoading(false)
      })
  }, [activeTab, selectedSettlementMonth])

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

  const handleWithdraw = async () => {
    if (!state.currentUser?.id) return

    setIsWithdrawing(true)
    try {
      await deactivateMember(state.currentUser.id)
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '회원 탈퇴에 실패했습니다')
    } finally {
      setIsWithdrawing(false)
      setShowWithdrawConfirm(false)
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: '프로필', icon: <User size={18} /> },
    { id: 'notifications', label: '알림', icon: <Bell size={18} /> },
    { id: 'appearance', label: '테마', icon: <Palette size={18} /> },
    { id: 'settlement', label: '정산', icon: <Wallet size={18} /> },
    { id: 'security', label: '보안', icon: <Shield size={18} /> },
  ]
  const themeOptions: { id: ThemeMode; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'light', label: '라이트 모드', description: '밝고 선명한 작업 환경', icon: <Sun size={18} /> },
    { id: 'dark', label: '다크 모드', description: '집중감을 높이는 어두운 화면', icon: <Moon size={18} /> },
  ]
  const activeSectionMeta = SETTINGS_SECTION_META[activeTab]

  return (
    <div className="settings-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      <header className="settings-header">
        <div className="settings-header-copy">
          <p className="settings-kicker">My Page</p>
          <p className="settings-subtitle">프로필, 알림, 테마, 정산, 보안 정보를 한 곳에서 관리하세요.</p>
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
          <section className="settings-section-hero">
            <div className="settings-section-hero-copy">
              <p className="settings-section-eyebrow">{activeSectionMeta.eyebrow}</p>
              <h3 className="settings-section-hero-title">{activeSectionMeta.title}</h3>
              <p className="settings-section-hero-description">{activeSectionMeta.description}</p>
            </div>
            <span className="settings-section-badge">{activeSectionMeta.badge}</span>
          </section>

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

          {activeTab === 'settlement' && (
            <section className="settings-section">
              <h3>개인 지각비 정산</h3>
              <div className="setting-field">
                <label>정산 월</label>
                <input
                  type="month"
                  value={selectedSettlementMonth}
                  onChange={(e) => setSelectedSettlementMonth(e.target.value)}
                  className="setting-input"
                />
              </div>

              {settlementLoading ? (
                <div className="settlement-empty-panel">
                  <p className="settlement-empty-title">정산 데이터를 불러오는 중입니다.</p>
                  <p className="settlement-empty-description">선택한 월 기준으로 개인 지각비를 계산하고 있습니다.</p>
                </div>
              ) : !settlement ? (
                <div className="settlement-empty-panel">
                  <p className="settlement-empty-title">표시할 정산 정보가 없습니다.</p>
                  <p className="settlement-empty-description">월을 선택하면 개인 지각비와 상세 내역을 확인할 수 있습니다.</p>
                </div>
              ) : (
                <div className="my-settlement-layout">
                  <div className="my-settlement-summary-grid">
                    <article className="my-settlement-card">
                      <span className="my-settlement-label">총 지각비</span>
                      <strong>{formatCurrency(settlement.lateFee)}</strong>
                      <p>{settlement.lateDays}건 · 총 {settlement.totalLateMinutes}분</p>
                    </article>
                    <article className="my-settlement-card">
                      <span className="my-settlement-label">근무 일수</span>
                      <strong>{settlement.scheduledDays}일</strong>
                      <p>출근 {settlement.attendedDays}일</p>
                    </article>
                    <article className="my-settlement-card">
                      <span className="my-settlement-label">소속 정보</span>
                      <strong>{settlement.memberName}</strong>
                      <p>{settlement.teamName}</p>
                    </article>
                  </div>

                  {settlement.items.length === 0 ? (
                    <div className="settlement-empty-panel compact">
                      <p className="settlement-empty-title">이 달의 정산 상세 내역이 없습니다.</p>
                      <p className="settlement-empty-description">지각 또는 근무 일정 기준 출근 기록이 생기면 상세가 표시됩니다.</p>
                    </div>
                  ) : (
                    <div className="my-settlement-table-wrap">
                      <table className="my-settlement-table">
                        <thead>
                          <tr>
                            <th>날짜</th>
                            <th>예정 근무</th>
                            <th>실제 출근</th>
                            <th>지각 분</th>
                            <th>지각비</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settlement.items.map((item) => (
                            <tr key={`${item.date}-${item.scheduledStartTime}`}>
                              <td>{item.date}</td>
                              <td>
                                {formatScheduleRangeLabel({
                                  startTime: item.scheduledStartTime,
                                  endTime: item.scheduledEndTime,
                                  endsNextDay: item.endsNextDay,
                                  scheduledStartAt: item.scheduledStartAt,
                                  scheduledEndAt: item.scheduledEndAt,
                                })}
                              </td>
                              <td>{item.checkInTime ? item.checkInTime.slice(11, 16) : '-'}</td>
                              <td>{item.lateMinutes}분</td>
                              <td>{formatCurrency(item.fee)}</td>
                              <td>
                                <span className={`my-settlement-status ${item.status}`}>
                                  {item.status === 'ON_TIME' ? '정상 출근' : item.status === 'LATE' ? '지각' : item.status === 'ABSENT' ? '미출근' : '근무 일정 없음'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
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

              <div className="danger-zone">
                <div className="danger-zone-head">
                  <span className="danger-zone-icon">
                    <AlertTriangle size={16} />
                  </span>
                  <div>
                    <h4>회원 탈퇴</h4>
                    <p>탈퇴하면 계정이 비활성화되고 현재 세션이 종료됩니다. 다시 사용하려면 관리자 도움이 필요합니다.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => setShowWithdrawConfirm((prev) => !prev)}
                >
                  회원 탈퇴
                </button>

                {showWithdrawConfirm && (
                  <div className="danger-confirm-box">
                    <p>정말 탈퇴하시겠습니까? 현재 계정이 즉시 비활성화됩니다.</p>
                    <div className="danger-confirm-actions">
                      <button
                        type="button"
                        className="danger-cancel-btn"
                        onClick={() => setShowWithdrawConfirm(false)}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="danger-confirm-btn"
                        onClick={handleWithdraw}
                        disabled={isWithdrawing}
                      >
                        {isWithdrawing ? '탈퇴 처리 중...' : '탈퇴 진행'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
