import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Users } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import type { User } from '../../entities/user/model/types'
import { updateMemberTeam } from '../../shared/api/membersApi'
import { formatTeamName, sortUsersByTeamAndName } from '../../shared/lib/team'
import { canChangeMemberTeamFor } from '../../shared/lib/permissions'
import { DataTableScroll, DataTableSection } from '../../shared/ui/DataTableSection'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Toast } from '../../shared/ui/Toast'
import './team-management.css'

const roleLabels = {
  ADMIN: '관리자',
  TEAM_LEAD: '팀장',
  MEMBER: '멤버',
}

const statusLabels = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
}

export function TeamManagement() {
  const { state, refreshMembers, refreshTeams } = useApp()
  const [search, setSearch] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [changeTeamFor, setChangeTeamFor] = useState<User | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const currentTeam = state.currentUser?.team

  const loadTeamMembers = async () => {
    try {
      await Promise.all([refreshMembers(), refreshTeams()])
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 멤버를 불러오지 못했습니다')
    }
  }

  useEffect(() => {
    if (!currentTeam) return
    loadTeamMembers()
  }, [currentTeam])

  const members = useMemo(() => (
    sortUsersByTeamAndName(
      state.users.filter((member) => member.team === currentTeam),
    )
  ), [currentTeam, state.users])

  const manageableMembers = useMemo(() => (
    members.filter((member) => canChangeMemberTeamFor(state.currentUser, member))
  ), [members, state.currentUser])

  const filteredMembers = useMemo(() => (
    sortUsersByTeamAndName(manageableMembers).filter((member) => {
      if (!search.trim()) return true
      const keyword = search.trim().toLowerCase()
      return member.name.toLowerCase().includes(keyword) || member.email.toLowerCase().includes(keyword)
    })
  ), [manageableMembers, search])

  const openTeamModal = (member: User) => {
    if (!canChangeMemberTeamFor(state.currentUser, member)) {
      setErrorMessage('팀장은 같은 팀의 활성 일반 멤버만 이동할 수 있습니다')
      return
    }

    setChangeTeamFor(member)
    const matchedTeam = state.teams.find((team) => team.name === member.team)
    setSelectedTeamId(matchedTeam?.id ?? null)
  }

  const handleConfirmTeamChange = async () => {
    if (!changeTeamFor || !selectedTeamId) return

    setSaving(true)
    try {
      const nextTeam = state.teams.find((team) => team.id === selectedTeamId)
      await updateMemberTeam(changeTeamFor.id, { teamId: selectedTeamId })
      await loadTeamMembers()
      setSuccessMessage(`${changeTeamFor.name}의 팀을 ${formatTeamName(nextTeam?.name)}으로 변경했습니다`)
      setChangeTeamFor(null)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 변경에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="team-management-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      )}

      <header className="team-management-header">
        <div className="team-management-copy">
          <p>팀장은 같은 팀 멤버를 확인하고 팀 이동만 관리할 수 있습니다.</p>
        </div>
        <div className="team-management-summary glass">
          <Users size={16} />
          <span>{formatTeamName(currentTeam)} 멤버 {members.length}명</span>
        </div>
      </header>

      <DataTableSection
        className="team-management-panel"
        title="팀 멤버 목록"
        description="팀장은 같은 팀의 활성 일반 멤버만 다른 팀으로 이동할 수 있습니다."
      >
        <div className="team-management-toolbar">
          <div className="team-management-search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름 또는 이메일 검색"
            />
          </div>
          <p className="team-management-caption">역할 변경, 상태 변경, 퇴출은 관리자만 가능합니다.</p>
        </div>

        <DataTableScroll className="team-management-table-wrap">
          <table className="team-management-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>현재 팀</th>
                <th>역할</th>
                <th>상태</th>
                <th>팀 변경</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="team-management-empty">
                    <EmptyState
                      compact
                      title="표시할 멤버가 없습니다."
                      description="검색 조건을 바꾸거나 멤버 상태를 다시 확인해 주세요."
                    />
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="team-member-cell">
                        <span className="team-member-avatar">{member.name[0]}</span>
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <span className="team-chip">
                        {formatTeamName(member.team)}
                      </span>
                    </td>
                    <td>{roleLabels[member.role]}</td>
                    <td>{statusLabels[member.status ?? 'ACTIVE']}</td>
                    <td>
                      <button
                        type="button"
                        className="team-change-btn"
                        onClick={() => openTeamModal(member)}
                      >
                        <ArrowLeftRight size={14} />
                        팀 변경
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableScroll>
      </DataTableSection>

      {changeTeamFor && (
        <div className="team-management-modal-overlay" onClick={() => setChangeTeamFor(null)}>
          <div className="team-management-modal glass" onClick={(event) => event.stopPropagation()}>
            <h3>{changeTeamFor.name} 팀 변경</h3>
            <p>팀장은 멤버의 소속 팀만 변경할 수 있습니다.</p>
            <div className="team-select-list">
              {state.teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`team-select-option ${selectedTeamId === team.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  {formatTeamName(team.name)}
                </button>
              ))}
            </div>
            <div className="team-management-modal-actions">
              <button type="button" className="team-cancel-btn" onClick={() => setChangeTeamFor(null)}>
                취소
              </button>
              <button
                type="button"
                className="team-confirm-btn"
                disabled={saving || selectedTeamId === null}
                onClick={handleConfirmTeamChange}
              >
                {saving ? '변경 중...' : '팀 변경 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
