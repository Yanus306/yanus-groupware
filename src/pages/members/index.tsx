import { useState, useEffect } from 'react'
import { Search, UserPlus, X, Crown } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { updateMemberRole, deactivateMember, activateMember } from '../../shared/api/membersApi'
import type { UserRole } from '../../entities/user/model/types'
import { getTeamOptions, formatTeamName, sortUsersByTeamAndName } from '../../shared/lib/team'
import {
  canAccessAdmin,
  canExpelMembersFor,
  canManageMemberRolesFor,
  canManageMemberStatusFor,
} from '../../shared/lib/permissions'
import { MemberManagementTable } from '../../shared/ui/MemberManagementTable'
import { SectionHeader } from '../../shared/ui/SectionHeader'
import { Toast } from '../../shared/ui/Toast'
import './members.css'

const roles = ['전체 역할', 'ADMIN', 'TEAM_LEAD', 'MEMBER']

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  TEAM_LEAD: '팀장',
  MEMBER: '멤버',
}

const ALL_ROLES: UserRole[] = ['MEMBER', 'TEAM_LEAD', 'ADMIN']

export function Members() {
  const { state, refreshMembers } = useApp()
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
  const isAdmin = canAccessAdmin(state.currentUser)

  useEffect(() => {
    if (state.users.length > 0) return
    refreshMembers()
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '멤버 목록을 불러오지 못했습니다'))
  }, [refreshMembers, state.users.length])

  const visibleUsers = sortUsersByTeamAndName(
    state.users.filter((user) => (user.status ?? 'ACTIVE') === 'ACTIVE'),
  )
  const baseTeamOptions = getTeamOptions(visibleUsers, state.teams)
  const activeTeamNames = new Set(visibleUsers.map((user) => user.team).filter((team): team is string => Boolean(team)))
  const teamOptions = baseTeamOptions.filter((team) => activeTeamNames.has(team.name))

  const filtered = visibleUsers.filter((user) => {
    const matchSearch = !search || user.name.toLowerCase().includes(search.toLowerCase())
    const matchTeam = teamFilter === '전체 팀' || user.team === teamFilter
    const matchRole = roleFilter === '전체 역할' || user.role === roleFilter
    return matchSearch && matchTeam && matchRole
  })

  const activeCountsByTeam = teamOptions.map((team) => ({
    id: team.id,
    name: team.name,
    count: visibleUsers.filter((user) => user.team === team.name).length,
  }))
  const maxActiveTeamCount = Math.max(...activeCountsByTeam.map((team) => team.count), 1)

  const handleOpenChangeRole = (id: string, name: string, currentRole: string) => {
    const targetUser = state.users.find((user) => user.id === id)
    if (!canManageMemberRolesFor(state.currentUser, targetUser)) {
      setErrorMessage('본인 계정의 역할은 변경할 수 없습니다')
      return
    }

    setChangeRoleFor({ id, name })
    setSelectedRole(currentRole as UserRole)
  }

  const handleConfirmRoleChange = async () => {
    if (!changeRoleFor) return

    setSaving(true)
    try {
      await updateMemberRole(changeRoleFor.id, selectedRole)
      await refreshMembers()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '역할 변경에 실패했습니다')
    }
    setSaving(false)
    setChangeRoleFor(null)
  }

  const handleDeactivate = async (id: string) => {
    const targetUser = state.users.find((user) => user.id === id)
    if (!canManageMemberStatusFor(state.currentUser, targetUser)) {
      setErrorMessage('본인 계정은 비활성화할 수 없습니다')
      return
    }

    setSaving(true)
    try {
      await deactivateMember(id)
      await refreshMembers()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '비활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleExpel = async (id: string) => {
    const member = state.users.find((item) => item.id === id)
    if (!canExpelMembersFor(state.currentUser, member)) {
      setErrorMessage('본인 계정은 퇴출할 수 없습니다')
      return
    }

    if (!window.confirm(`${member?.name ?? '선택한 멤버'}를 퇴출하시겠습니까?`)) {
      return
    }

    setSaving(true)
    try {
      await deactivateMember(id)
      await refreshMembers()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '퇴출에 실패했습니다')
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    const targetUser = state.users.find((user) => user.id === id)
    if (!canManageMemberStatusFor(state.currentUser, targetUser)) {
      setErrorMessage('본인 계정의 상태는 변경할 수 없습니다')
      return
    }

    setSaving(true)
    try {
      await activateMember(id)
      await refreshMembers()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setSaving(true)
    try {
      await refreshMembers()
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
          <input placeholder="멤버 이름 검색" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="filter-group">
          <span className="filter-label">팀</span>
          <div className="filter-btns">
            <button className={teamFilter === '전체 팀' ? 'active' : ''} onClick={() => setTeamFilter('전체 팀')}>
              전체 팀
            </button>
            {teamOptions.map((team) => (
              <button key={team.id} className={teamFilter === team.name ? 'active' : ''} onClick={() => setTeamFilter(team.name)}>
                {formatTeamName(team.name)}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">역할</span>
          <div className="filter-btns">
            {roles.map((role) => (
              <button key={role} className={roleFilter === role ? 'active' : ''} onClick={() => setRoleFilter(role)}>
                {roleLabels[role] ?? role}
              </button>
            ))}
          </div>
        </div>
        <div className="total-members glass">전체 멤버 {visibleUsers.length}명</div>
      </div>

      <div className="members-content">
        <div className="table-section glass">
          <SectionHeader
            title="멤버 목록"
            description="활성 멤버를 팀과 역할 기준으로 빠르게 확인할 수 있습니다."
          />
          <MemberManagementTable
            members={filtered}
            saving={saving}
            showStatus={isAdmin}
            showActions={isAdmin}
            onOpenRoleChange={isAdmin ? (member) => handleOpenChangeRole(member.id, member.name, member.role) : undefined}
            onDeactivate={isAdmin ? handleDeactivate : undefined}
            onActivate={isAdmin ? handleActivate : undefined}
            onExpel={isAdmin ? handleExpel : undefined}
            canManageRoleFor={(member) => canManageMemberRolesFor(state.currentUser, member)}
            canManageStatusFor={(member) => canManageMemberStatusFor(state.currentUser, member)}
            canExpelFor={(member) => canExpelMembersFor(state.currentUser, member)}
          />
        </div>

        <aside className="stats-sidebar glass">
          <SectionHeader
            title="팀별 멤버 수"
            description="비활성 멤버는 집계에서 제외됩니다."
          />
          <div className="bar-chart">
            {activeCountsByTeam.map((team) => {
              const count = team.count
              return (
                <div
                  key={team.id}
                  className="bar"
                  aria-label={`${formatTeamName(team.name)} 활성 멤버 ${count}명`}
                  style={{ height: `${Math.max((count / maxActiveTeamCount) * 100, 8)}%` }}
                >
                  <span>{formatTeamName(team.name)}</span>
                  <span>{count}</span>
                </div>
              )
            })}
          </div>
          <SectionHeader
            title="역할 분포"
            description="현재 활성 멤버 기준으로 역할 비중을 보여줍니다."
          />
          <div className="pie-legend">
            <span><i style={{ background: 'var(--accent-purple)' }} /> 관리자 {visibleUsers.filter((user) => user.role === 'ADMIN').length}</span>
            <span><i style={{ background: 'var(--accent-blue, #72b8e8)' }} /> 팀장 {visibleUsers.filter((user) => user.role === 'TEAM_LEAD').length}</span>
            <span><i style={{ background: 'var(--text-secondary)' }} /> 멤버 {visibleUsers.filter((user) => user.role === 'MEMBER').length}</span>
          </div>
        </aside>
      </div>

      {changeRoleFor && (
        <div className="modal-overlay" onClick={() => setChangeRoleFor(null)}>
          <div className="change-role-modal glass" onClick={(event) => event.stopPropagation()}>
            <h3>역할 변경 - {changeRoleFor.name}</h3>
            <div className="role-options">
              {ALL_ROLES.map((role) => (
                <div key={role} className={`role-option ${selectedRole === role ? 'selected' : ''}`} onClick={() => setSelectedRole(role)}>
                  <span className={`role-pill ${role}`}>
                    {role === 'ADMIN' && <Crown size={14} />}
                    {roleLabels[role]}
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
          <div className="invite-modal glass" onClick={(event) => event.stopPropagation()}>
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
                onChange={(event) => setInviteEmail(event.target.value)}
                className="setting-input"
              />
            </div>
            <div className="setting-field">
              <label>역할</label>
              <div className="role-btns">
                {ALL_ROLES.map((role) => (
                  <button key={role} className={`role-btn ${inviteRole === role ? 'active' : ''}`} onClick={() => setInviteRole(role)}>
                    {roleLabels[role]}
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
