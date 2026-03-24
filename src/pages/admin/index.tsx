import { useState, useEffect } from 'react'
import { Crown, ChevronDown, Download, ArrowLeftRight } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { TeamAttendanceStatus } from '../../features/attendance/ui'
import { getAttendanceByDate } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import { getMembers, updateMemberRole, deactivateMember, activateMember, updateMemberTeam } from '../../shared/api/membersApi'
import type { Team, User, UserRole } from '../../entities/user/model/types'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { Toast } from '../../shared/ui/Toast'
import { getTodayStr } from '../../shared/lib/date'
import { getTeams } from '../../shared/api/teamsApi'
import type { TeamResponse } from '../../shared/api/teamsApi'
import './admin.css'

type Tab = 'attendance' | 'members'

const ALL_ROLES: UserRole[] = ['MEMBER', 'TEAM_LEAD', 'ADMIN']
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

export function Admin() {
  const { loadMembers } = useApp()
  const [tab, setTab] = useState<Tab>('attendance')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string; current: UserRole } | null>(null)
  const [changeTeamFor, setChangeTeamFor] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEMBER')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [teams, setTeams] = useState<TeamResponse[]>([])

  const todayStr = getTodayStr()

  useEffect(() => {
    Promise.all([getMembers(), getAttendanceByDate(todayStr), getTeams()])
      .then(([memberList, attendanceList, teamList]) => {
        setMembers(memberList)
        loadMembers(memberList)
        setRecords(attendanceList)
        setTeams(teamList)
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '관리 데이터를 불러오지 못했습니다'))
  }, [todayStr, loadMembers])

  const handleOpenRoleChange = (id: string, name: string, current: UserRole) => {
    setChangeRoleFor({ id, name, current })
    setSelectedRole(current)
  }

  const handleConfirmRoleChange = async () => {
    if (!changeRoleFor) return
    setSaving(true)
    try {
      await updateMemberRole(changeRoleFor.id, selectedRole)
      const updated = members.map((u) =>
        u.id === changeRoleFor.id ? { ...u, role: selectedRole } : u,
      )
      setMembers(updated)
      loadMembers(updated)
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
      setMembers(updated)
      loadMembers(updated)
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
      const updated = await getMembers()
      setMembers(updated)
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
      setMembers(updated)
      loadMembers(updated)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '활성화에 실패했습니다')
    }
    setSaving(false)
  }

  const handleOpenTeamChange = (member: User) => {
    setChangeTeamFor(member)
    const currentTeam = teams.find((team) => team.name === member.team)
    setSelectedTeamId(currentTeam?.id ?? null)
  }

  const handleConfirmTeamChange = async () => {
    if (!changeTeamFor || !selectedTeamId) return

    setSaving(true)
    try {
      await updateMemberTeam(changeTeamFor.id, { teamId: selectedTeamId })
      const updated = await getMembers()
      setMembers(updated)
      loadMembers(updated)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 변경에 실패했습니다')
    }
    setSaving(false)
    setChangeTeamFor(null)
  }

  const handleExportCsv = () => {
    exportAttendanceToCsv(
      records.map((r) => ({
        id: String(r.id),
        userId: String(r.memberId),
        userName: r.memberName,
        date: r.workDate,
        clockIn: r.checkInTime?.slice(11, 16) ?? '',
        clockOut: r.checkOutTime?.slice(11, 16),
        status: r.status === 'LEFT' ? 'done' : 'working',
      })),
      todayStr,
    )
  }

  return (
    <div className="admin-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
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

      {/* 탭 */}
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
      </div>

      {/* 출근 현황 탭 */}
      {tab === 'attendance' && (
        <div className="admin-tab-content glass">
          <TeamAttendanceStatus members={members} records={records} date={todayStr} />
        </div>
      )}

      {/* 멤버 관리 탭 */}
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
                {members.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="admin-avatar">{u.name[0]}</span>
                      {u.name}
                    </td>
                    <td>
                      <span className={`admin-team-tag ${u.team}`}>
                        {teamLabels[u.team] ?? u.team}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-role-tag ${u.role}`}>
                        {u.role === 'ADMIN' && <Crown size={12} />}
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    </td>
                    <td>
                      <div className="admin-status-cell">
                        <span className={`admin-status-tag ${u.status ?? 'ACTIVE'}`}>
                          {statusLabels[u.status ?? 'ACTIVE'] ?? (u.status ?? 'ACTIVE')}
                        </span>
                        {u.status === 'INACTIVE' ? (
                          <button
                            type="button"
                            className="admin-action-btn activate-btn"
                            disabled={saving}
                            onClick={() => handleActivate(u.id)}
                          >
                            활성화
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-action-btn mute-btn"
                            disabled={saving}
                            onClick={() => handleDeactivate(u.id)}
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
                        onClick={() => handleOpenTeamChange(u)}
                      >
                        팀 변경 <ArrowLeftRight size={13} />
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={() => handleOpenRoleChange(u.id, u.name, u.role)}
                      >
                        역할 변경 <ChevronDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn deactivate-btn"
                        disabled={saving || u.status === 'INACTIVE'}
                        onClick={() => handleExpel(u.id)}
                      >
                        {u.status === 'INACTIVE' ? '퇴출됨' : '퇴출'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {changeTeamFor && (
        <div className="admin-modal-overlay" onClick={() => setChangeTeamFor(null)}>
          <div className="admin-modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>팀 변경 — {changeTeamFor.name}</h3>
            <div className="admin-role-options">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`admin-role-option ${selectedTeamId === team.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <span className={`admin-team-tag ${team.name as Team}`}>
                    {teamLabels[team.name as Team] ?? team.name}
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

      {/* 역할 변경 모달 */}
      {changeRoleFor && (
        <div className="admin-modal-overlay" onClick={() => setChangeRoleFor(null)}>
          <div className="admin-modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>역할 변경 — {changeRoleFor.name}</h3>
            <div className="admin-role-options">
              {ALL_ROLES.map((r) => (
                <div
                  key={r}
                  className={`admin-role-option ${selectedRole === r ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(r)}
                >
                  <span className={`admin-role-pill ${r}`}>
                    {r === 'ADMIN' && <Crown size={13} />}
                    {roleLabels[r]}
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
