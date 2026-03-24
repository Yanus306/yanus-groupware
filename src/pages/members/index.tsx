import { useState, useEffect } from 'react'
import { Search, Crown, ChevronDown, UserPlus, X } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { getMembers, updateMemberRole, deactivateMember, activateMember } from '../../shared/api/membersApi'
import type { UserRole } from '../../entities/user/model/types'
import { Toast } from '../../shared/ui/Toast'
import './members.css'

const teams = ['전체 팀', 'BACKEND', 'FRONTEND', 'AI', 'SECURITY']
const roles = ['전체 역할', 'ADMIN', 'TEAM_LEAD', 'MEMBER']

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  TEAM_LEAD: '팀장',
  MEMBER: '멤버',
}

const teamLabels: Record<string, string> = {
  BACKEND: '백엔드',
  FRONTEND: '프론트엔드',
  AI: 'AI',
  SECURITY: '보안',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
}

const ALL_ROLES: UserRole[] = ['MEMBER', 'TEAM_LEAD', 'ADMIN']

export function Members() {
  const { state, isAdmin, loadMembers } = useApp()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('전체 팀')
  const [roleFilter, setRoleFilter] = useState('전체 역할')
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string } | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEMBER')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('MEMBER')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    getMembers().then(loadMembers).catch((err) => setErrorMessage(err instanceof Error ? err.message : '멤버 목록을 불러오지 못했습니다'))
  }, [loadMembers])

  const filtered = state.users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
    const matchTeam = teamFilter === '전체 팀' || u.team === teamFilter
    const matchRole = roleFilter === '전체 역할' || u.role === roleFilter
    return matchSearch && matchTeam && matchRole
  })

  const handleOpenChangeRole = (id: string, name: string, currentRole: string) => {
    setChangeRoleFor({ id, name })
    setSelectedRole(currentRole as UserRole)
  }

  const handleConfirmRoleChange = async () => {
    if (!changeRoleFor) return
    setSaving(true)
    try {
      await updateMemberRole(changeRoleFor.id, selectedRole)
      loadMembers(state.users.map((u) => u.id === changeRoleFor.id ? { ...u, role: selectedRole } : u))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '역할 변경에 실패했습니다')
    }
    setSaving(false)
    setChangeRoleFor(null)
  }

  const handleDeactivate = async (id: string) => {
    setSaving(true)
    try {
      await deactivateMember(id)
      const updated = await getMembers()
      loadMembers(updated)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '비활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleExpel = async (id: string) => {
    const member = state.users.find((item) => item.id === id)
    if (!window.confirm(`${member?.name ?? '선택한 멤버'}를 퇴출하시겠습니까?`)) {
      return
    }

    setSaving(true)
    try {
      await deactivateMember(id)
      const updated = await getMembers()
      loadMembers(updated)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '퇴출에 실패했습니다')
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    setSaving(true)
    try {
      await activateMember(id)
      const updated = await getMembers()
      loadMembers(updated)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setSaving(true)
    try {
      const updated = await getMembers()
      loadMembers(updated)
      setInviteEmail('')
      setShowInvite(false)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '초대에 실패했습니다')
    }
    setSaving(false)
  }

  return (
    <div className="members-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      <header className="members-header">
        <div className="members-header-copy">
          <p>멤버 상태와 역할을 한 곳에서 확인하고 관리합니다.</p>
          {isAdmin && <span className="admin-badge">관리자 전용</span>}
        </div>
        {isAdmin && (
          <button className="invite-btn glass" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} />
            멤버 초대
          </button>
        )}
      </header>

      <div className="filters-row">
        <div className="search-wrap glass">
          <Search size={18} />
          <input placeholder="멤버 이름 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <span className="filter-label">팀</span>
          <div className="filter-btns">
            {teams.map((t) => (
              <button key={t} className={teamFilter === t ? 'active' : ''} onClick={() => setTeamFilter(t)}>
                {teamLabels[t] ?? t}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">역할</span>
          <div className="filter-btns">
            {roles.map((r) => (
              <button key={r} className={roleFilter === r ? 'active' : ''} onClick={() => setRoleFilter(r)}>
                {roleLabels[r] ?? r}
              </button>
            ))}
          </div>
        </div>
        <div className="total-members glass">전체 멤버 {state.users.length}명</div>
      </div>

      <div className="members-content">
        <div className="table-section glass">
          <h3>멤버 목록</h3>
          <table className="members-table">
            <thead>
              <tr>
                <th>프로필</th>
                <th>팀</th>
                <th>역할</th>
                {isAdmin && <th>상태</th>}
                {isAdmin && <th>관리</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td><span className="avatar">{u.name[0]}</span>{u.name}</td>
                  <td><span className={"team-tag " + u.team}>{teamLabels[u.team] ?? u.team}</span></td>
                  <td>
                    <span className={"role-tag " + u.role}>
                      {u.role === 'ADMIN' && <Crown size={14} />}
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="member-status-cell">
                        <span className={`member-status-tag ${u.status ?? 'ACTIVE'}`}>
                          {statusLabels[u.status ?? 'ACTIVE'] ?? (u.status ?? 'ACTIVE')}
                        </span>
                        {u.status === 'INACTIVE' ? (
                          <button className="action-btn activate-btn" disabled={saving} onClick={() => handleActivate(u.id)}>
                            활성화
                          </button>
                        ) : (
                          <button className="action-btn mute-btn" disabled={saving} onClick={() => handleDeactivate(u.id)}>
                            비활성화
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="action-btn" onClick={() => handleOpenChangeRole(u.id, u.name, u.role)}>
                        역할 변경 <ChevronDown size={14} />
                      </button>
                      <button
                        className="action-btn deactivate-btn"
                        disabled={saving || u.status === 'INACTIVE'}
                        onClick={() => handleExpel(u.id)}
                      >
                        {u.status === 'INACTIVE' ? '퇴출됨' : '퇴출'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="stats-sidebar glass">
          <h3>팀별 멤버 수</h3>
          <div className="bar-chart">
            {Object.entries(teamLabels).map(([key, label]) => {
              const count = state.users.filter((u) => u.team === key).length
              const max = Math.max(...Object.keys(teamLabels).map((k) => state.users.filter((u) => u.team === k).length), 1)
              return (
                <div key={key} className="bar" style={{ height: Math.max((count / max) * 100, 8) + '%' }}>
                  <span>{label.split(' ')[0]}</span><span>{count}</span>
                </div>
              )
            })}
          </div>
          <h3>역할 분포</h3>
          <div className="pie-legend">
            <span><i style={{ background: 'var(--accent-purple)' }} /> 관리자 {state.users.filter((u) => u.role === 'ADMIN').length}</span>
            <span><i style={{ background: 'var(--accent-blue, #72b8e8)' }} /> 팀장 {state.users.filter((u) => u.role === 'TEAM_LEAD').length}</span>
            <span><i style={{ background: 'var(--text-secondary)' }} /> 멤버 {state.users.filter((u) => u.role === 'MEMBER').length}</span>
          </div>
        </aside>
      </div>

      {changeRoleFor && (
        <div className="modal-overlay" onClick={() => setChangeRoleFor(null)}>
          <div className="change-role-modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>역할 변경 - {changeRoleFor.name}</h3>
            <div className="role-options">
              {ALL_ROLES.map((r) => (
                <div key={r} className={"role-option " + (selectedRole === r ? 'selected' : '')} onClick={() => setSelectedRole(r)}>
                  <span className={"role-pill " + r}>
                    {r === 'ADMIN' && <Crown size={14} />}
                    {roleLabels[r]}
                  </span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setChangeRoleFor(null)}>취소</button>
              <button className="confirm-btn" disabled={saving} onClick={handleConfirmRoleChange}>
                {saving ? '저장 중...' : '변경 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="invite-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>멤버 초대</h3>
              <button className="close-btn" onClick={() => setShowInvite(false)}><X size={18} /></button>
            </div>
            <div className="setting-field">
              <label>이메일 주소</label>
              <input
                type="email"
                placeholder="user@yanus.kr"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="setting-input"
              />
            </div>
            <div className="setting-field">
              <label>역할</label>
              <div className="role-btns">
                {ALL_ROLES.map((r) => (
                  <button key={r} className={"role-btn " + (inviteRole === r ? 'active' : '')} onClick={() => setInviteRole(r)}>
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowInvite(false)}>취소</button>
              <button className="confirm-btn" disabled={saving || !inviteEmail.trim()} onClick={handleInvite}>
                {saving ? '초대 중...' : '초대 보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
