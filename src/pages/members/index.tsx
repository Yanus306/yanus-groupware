import { useState, useEffect } from 'react'
import { Search, Crown, ChevronDown, UserPlus, X } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { getMembers, updateMemberRole, deactivateMember, activateMember } from '../../shared/api/membersApi'
import type { UserRole } from '../../entities/user/model/types'
import { Toast } from '../../shared/ui/Toast'
import './members.css'

const teams = ['All Teams', 'BACKEND', 'FRONTEND', 'AI', 'SECURITY']
const roles = ['All Roles', 'ADMIN', 'TEAM_LEAD', 'MEMBER']

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  TEAM_LEAD: 'Team Lead',
  MEMBER: 'Member',
}

const teamLabels: Record<string, string> = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  AI: 'AI',
  SECURITY: 'Security',
}

const ALL_ROLES: UserRole[] = ['MEMBER', 'TEAM_LEAD', 'ADMIN']

export function Members() {
  const { state, isAdmin, loadMembers } = useApp()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('All Teams')
  const [roleFilter, setRoleFilter] = useState('All Roles')
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
    const matchTeam = teamFilter === 'All Teams' || teamLabels[u.team] === teamFilter
    const matchRole = roleFilter === 'All Roles' || roleLabels[u.role] === roleFilter
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
        <h1>
          {isAdmin ? 'Member Management' : '멤버 목록'}
          {isAdmin && <span className="admin-badge">! Admin Only</span>}
        </h1>
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
          <input placeholder="Search Members..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <span className="filter-label">Team</span>
          <div className="filter-btns">
            {teams.map((t) => (
              <button key={t} className={teamFilter === t ? 'active' : ''} onClick={() => setTeamFilter(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Role</span>
          <div className="filter-btns">
            {roles.map((r) => (
              <button key={r} className={roleFilter === r ? 'active' : ''} onClick={() => setRoleFilter(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="total-members glass">Total Members: {state.users.length}</div>
      </div>

      <div className="members-content">
        <div className="table-section glass">
          <h3>Member List Table.</h3>
          <table className="members-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Current Team</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
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
                    <td className="actions-cell">
                      <button className="action-btn" onClick={() => handleOpenChangeRole(u.id, u.name, u.role)}>
                        Change Role <ChevronDown size={14} />
                      </button>
                      {'active' in u && !(u as { active?: boolean }).active ? (
                        <button className="action-btn activate-btn" disabled={saving} onClick={() => handleActivate(u.id)}>
                          활성화
                        </button>
                      ) : (
                        <button className="action-btn deactivate-btn" disabled={saving} onClick={() => handleDeactivate(u.id)}>
                          비활성화
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="stats-sidebar glass">
          <h3>Members per Team</h3>
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
          <h3>Role Distribution</h3>
          <div className="pie-legend">
            <span><i style={{ background: 'var(--accent-purple)' }} /> Admin {state.users.filter((u) => u.role === 'ADMIN').length}</span>
            <span><i style={{ background: 'var(--accent-blue, #72b8e8)' }} /> Team Lead {state.users.filter((u) => u.role === 'TEAM_LEAD').length}</span>
            <span><i style={{ background: 'var(--text-secondary)' }} /> Member {state.users.filter((u) => u.role === 'MEMBER').length}</span>
          </div>
        </aside>
      </div>

      {changeRoleFor && (
        <div className="modal-overlay" onClick={() => setChangeRoleFor(null)}>
          <div className="change-role-modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>Change Role — {changeRoleFor.name}</h3>
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
              <button className="cancel-btn" onClick={() => setChangeRoleFor(null)}>Cancel</button>
              <button className="confirm-btn" disabled={saving} onClick={handleConfirmRoleChange}>
                {saving ? '저장 중...' : 'Confirm Change'}
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
