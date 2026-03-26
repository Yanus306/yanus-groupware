import { useState, useEffect } from 'react'
import { Crown, ChevronDown, Download, ArrowLeftRight, FolderPlus, Trash2, Users } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { TeamAttendanceStatus } from '../../features/attendance/ui'
import { getAttendanceByDate } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import { getMembers, updateMemberRole, deactivateMember, activateMember, updateMemberTeam } from '../../shared/api/membersApi'
import type { User, UserRole } from '../../entities/user/model/types'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { Toast } from '../../shared/ui/Toast'
import { getTodayStr } from '../../shared/lib/date'
import { createTeam, deleteTeam, getTeams } from '../../shared/api/teamsApi'
import type { TeamResponse } from '../../shared/api/teamsApi'
import { FALLBACK_TEAMS, formatTeamName, getTeamOptions, sortTeams, sortUsersByTeamAndName } from '../../shared/lib/team'
import './admin.css'

type Tab = 'attendance' | 'members' | 'teams'

const ALL_ROLES: UserRole[] = ['MEMBER', 'TEAM_LEAD', 'ADMIN']
const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  TEAM_LEAD: '팀장',
  MEMBER: '멤버',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
}

export function Admin() {
  const { loadMembers } = useApp()
  const [tab, setTab] = useState<Tab>('attendance')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [teams, setTeams] = useState<TeamResponse[]>(FALLBACK_TEAMS)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string; current: UserRole } | null>(null)
  const [changeTeamFor, setChangeTeamFor] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEMBER')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [newTeamName, setNewTeamName] = useState('')

  const todayStr = getTodayStr()
  const teamOptions = getTeamOptions(members, teams)

  useEffect(() => {
    Promise.all([
      getMembers(),
      getAttendanceByDate(todayStr),
      getTeams().catch(() => FALLBACK_TEAMS),
    ])
      .then(([memberList, attendanceList, teamList]) => {
        const sortedMembers = sortUsersByTeamAndName(memberList)
        setMembers(sortedMembers)
        loadMembers(sortedMembers)
        setRecords(attendanceList)
        setTeams(sortTeams(teamList))
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '관리 데이터를 불러오지 못했습니다'))
  }, [todayStr, loadMembers])

  const reloadMembersAndTeams = async () => {
    const [memberList, teamList] = await Promise.all([
      getMembers(),
      getTeams().catch(() => FALLBACK_TEAMS),
    ])
    const sortedMembers = sortUsersByTeamAndName(memberList)
    setMembers(sortedMembers)
    loadMembers(sortedMembers)
    setTeams(sortTeams(teamList))
  }

  const handleOpenRoleChange = (id: string, name: string, current: UserRole) => {
    setChangeRoleFor({ id, name, current })
    setSelectedRole(current)
  }

  const handleConfirmRoleChange = async () => {
    if (!changeRoleFor) return

    setSaving(true)
    try {
      await updateMemberRole(changeRoleFor.id, selectedRole)
      const updated = sortUsersByTeamAndName(members.map((member) =>
        member.id === changeRoleFor.id ? { ...member, role: selectedRole } : member,
      ))
      setMembers(updated)
      loadMembers(updated)
      setSuccessMessage(`${changeRoleFor.name}의 역할을 ${roleLabels[selectedRole]}로 변경했습니다`)
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
      await reloadMembersAndTeams()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '비활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleExpel = async (id: string) => {
    const member = members.find((item) => item.id === id)
    if (!window.confirm(`${member?.name ?? '선택한 멤버'}를 퇴출하시겠습니까?`)) {
      return
    }

    setSaving(true)
    try {
      await deactivateMember(id)
      await reloadMembersAndTeams()
      setSuccessMessage(`${member?.name ?? '선택한 멤버'}를 퇴출 처리했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '퇴출에 실패했습니다')
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    setSaving(true)
    try {
      await activateMember(id)
      await reloadMembersAndTeams()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleOpenTeamChange = (member: User) => {
    setChangeTeamFor(member)
    const currentTeam = teamOptions.find((team) => team.name === member.team)
    setSelectedTeamId(currentTeam?.id ?? null)
  }

  const handleConfirmTeamChange = async () => {
    if (!changeTeamFor || !selectedTeamId) return

    setSaving(true)
    try {
      const nextTeam = teamOptions.find((team) => team.id === selectedTeamId)
      await updateMemberTeam(changeTeamFor.id, { teamId: selectedTeamId })
      await reloadMembersAndTeams()
      setSuccessMessage(`${changeTeamFor.name}의 팀을 ${formatTeamName(nextTeam?.name)}으로 변경했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 변경에 실패했습니다')
    }
    setSaving(false)
    setChangeTeamFor(null)
  }

  const handleCreateTeam = async () => {
    const trimmed = newTeamName.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      await createTeam(trimmed)
      const refreshedTeams = await getTeams().catch(() => FALLBACK_TEAMS)
      setTeams(sortTeams(refreshedTeams))
      setNewTeamName('')
      setSuccessMessage(`${trimmed}을 생성했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 생성에 실패했습니다')
    }
    setSaving(false)
  }

  const handleDeleteTeam = async (team: TeamResponse) => {
    const memberCount = members.filter((member) => member.team === team.name).length
    const confirmMessage = memberCount > 0
      ? `${formatTeamName(team.name)}에는 현재 ${memberCount}명의 멤버가 있습니다. 백엔드 정책에 따라 삭제가 거부될 수 있습니다. 계속하시겠습니까?`
      : `${formatTeamName(team.name)}을 삭제하시겠습니까?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setSaving(true)
    try {
      await deleteTeam(team.id)
      const refreshedTeams = await getTeams().catch(() => FALLBACK_TEAMS)
      setTeams(sortTeams(refreshedTeams))
      setSuccessMessage(`${formatTeamName(team.name)}을 삭제했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 삭제에 실패했습니다')
    }
    setSaving(false)
  }

  const handleExportCsv = () => {
    exportAttendanceToCsv(
      records.map((record) => ({
        id: String(record.id),
        userId: String(record.memberId),
        userName: record.memberName,
        date: record.workDate,
        clockIn: record.checkInTime?.slice(11, 16) ?? '',
        clockOut: record.checkOutTime?.slice(11, 16),
        status: record.status === 'LEFT' ? 'done' : 'working',
      })),
      todayStr,
    )
  }

  return (
    <div className="admin-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      )}

      <header className="admin-header">
        <div className="admin-title-row">
          <Crown size={22} className="admin-crown-icon" />
          <p>출근 현황과 멤버 상태를 한 곳에서 관리합니다.</p>
        </div>
        <div className="admin-header-actions">
          {tab === 'attendance' && (
            <button className="admin-export-btn glass" onClick={handleExportCsv}>
              <Download size={16} />
              CSV 내보내기
            </button>
          )}
        </div>
      </header>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'attendance' ? 'active' : ''}`}
          onClick={() => setTab('attendance')}
        >
          출근 현황
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'members' ? 'active' : ''}`}
          onClick={() => setTab('members')}
        >
          멤버 관리
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'teams' ? 'active' : ''}`}
          onClick={() => setTab('teams')}
        >
          팀 관리
        </button>
      </div>

      {tab === 'attendance' && (
        <div className="admin-tab-content glass">
          <TeamAttendanceStatus members={members} records={records} date={todayStr} />
        </div>
      )}

      {tab === 'members' && (
        <div className="admin-tab-content glass">
          <h3 className="admin-section-title">멤버 목록</h3>
          <div className="admin-table-wrap">
            <table className="admin-members-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>팀</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <span className="admin-avatar">{member.name[0]}</span>
                      {member.name}
                    </td>
                    <td>
                      <span className="admin-team-tag">
                        {formatTeamName(member.team)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-role-tag ${member.role}`}>
                        {member.role === 'ADMIN' && <Crown size={12} />}
                        {roleLabels[member.role] ?? member.role}
                      </span>
                    </td>
                    <td>
                      <div className="admin-status-cell">
                        <span className={`admin-status-tag ${member.status ?? 'ACTIVE'}`}>
                          {statusLabels[member.status ?? 'ACTIVE'] ?? (member.status ?? 'ACTIVE')}
                        </span>
                        {member.status === 'INACTIVE' ? (
                          <button
                            type="button"
                            className="admin-action-btn activate-btn"
                            disabled={saving}
                            onClick={() => handleActivate(member.id)}
                          >
                            활성화
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-action-btn mute-btn"
                            disabled={saving}
                            onClick={() => handleDeactivate(member.id)}
                          >
                            비활성화
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="admin-actions-cell">
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={() => handleOpenTeamChange(member)}
                      >
                        팀 변경 <ArrowLeftRight size={13} />
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={() => handleOpenRoleChange(member.id, member.name, member.role)}
                      >
                        역할 변경 <ChevronDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn deactivate-btn"
                        disabled={saving || member.status === 'INACTIVE'}
                        onClick={() => handleExpel(member.id)}
                      >
                        {member.status === 'INACTIVE' ? '퇴출됨' : '퇴출'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'teams' && (
        <div className="admin-tab-content glass">
          <div className="admin-team-manager-head">
            <div>
              <h3 className="admin-section-title">팀 목록</h3>
              <p className="admin-team-manager-copy">새 팀을 추가하거나 더 이상 사용하지 않는 팀을 삭제할 수 있습니다.</p>
            </div>
            <div className="admin-team-create">
              <input
                type="text"
                value={newTeamName}
                onChange={(event) => setNewTeamName(event.target.value)}
                placeholder="예: 5팀"
              />
              <button
                type="button"
                className="admin-create-team-btn"
                disabled={saving || !newTeamName.trim()}
                onClick={handleCreateTeam}
              >
                <FolderPlus size={15} />
                팀 추가
              </button>
            </div>
          </div>

          <div className="admin-team-grid">
            {teamOptions.map((team) => {
              const memberCount = members.filter((member) => member.team === team.name).length
              return (
                <article key={team.id} className="admin-team-card">
                  <div className="admin-team-card-head">
                    <span className="admin-team-tag">{formatTeamName(team.name)}</span>
                    <button
                      type="button"
                      className="admin-team-delete-btn"
                      disabled={saving}
                      onClick={() => handleDeleteTeam(team)}
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                  <div className="admin-team-card-body">
                    <span className="admin-team-count">
                      <Users size={14} />
                      소속 멤버 {memberCount}명
                    </span>
                    <p>팀 삭제 전 멤버 이동이 필요한 경우 멤버 관리에서 먼저 팀을 변경해 주세요.</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {changeTeamFor && (
        <div className="admin-modal-overlay" onClick={() => setChangeTeamFor(null)}>
          <div className="admin-modal glass" onClick={(event) => event.stopPropagation()}>
            <h3>팀 변경 — {changeTeamFor.name}</h3>
            <div className="admin-role-options">
              {teamOptions.map((team) => (
                <div
                  key={team.id}
                  className={`admin-role-option ${selectedTeamId === team.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <span className="admin-team-tag">
                    {formatTeamName(team.name)}
                  </span>
                </div>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setChangeTeamFor(null)}>
                취소
              </button>
              <button
                type="button"
                className="confirm-btn"
                disabled={saving || selectedTeamId === null}
                onClick={handleConfirmTeamChange}
              >
                {saving ? '저장 중...' : '변경 확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {changeRoleFor && (
        <div className="admin-modal-overlay" onClick={() => setChangeRoleFor(null)}>
          <div className="admin-modal glass" onClick={(event) => event.stopPropagation()}>
            <h3>역할 변경 — {changeRoleFor.name}</h3>
            <div className="admin-role-options">
              {ALL_ROLES.map((role) => (
                <div
                  key={role}
                  className={`admin-role-option ${selectedRole === role ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  <span className={`admin-role-pill ${role}`}>
                    {role === 'ADMIN' && <Crown size={13} />}
                    {roleLabels[role]}
                  </span>
                </div>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setChangeRoleFor(null)}>
                취소
              </button>
              <button
                type="button"
                className="confirm-btn"
                disabled={saving}
                onClick={handleConfirmRoleChange}
              >
                {saving ? '저장 중...' : '변경 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
