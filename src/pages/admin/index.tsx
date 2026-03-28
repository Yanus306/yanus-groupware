import { useState, useEffect } from 'react'
import { Crown, Download, FolderPlus, History, Trash2, Users } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { TeamAttendanceStatus } from '../../features/attendance/ui'
import { getAttendanceByDate } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import { getAuditLogs } from '../../shared/api/auditLogsApi'
import type { AuditLog } from '../../shared/api/auditLogsApi'
import { updateMemberRole, deactivateMember, activateMember, updateMemberTeam } from '../../shared/api/membersApi'
import type { User, UserRole } from '../../entities/user/model/types'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { Toast } from '../../shared/ui/Toast'
import { getTodayStr } from '../../shared/lib/date'
import { createTeam, deleteTeam } from '../../shared/api/teamsApi'
import type { TeamResponse } from '../../shared/api/teamsApi'
import { DEFAULT_SIGNUP_TEAM_NAME, formatTeamName, getTeamOptions, sortUsersByTeamAndName } from '../../shared/lib/team'
import {
  canChangeMemberTeamFor,
  canExpelMembersFor,
  canManageMemberRolesFor,
  canManageMemberStatusFor,
} from '../../shared/lib/permissions'
import { MemberManagementTable } from '../../shared/ui/MemberManagementTable'
import { DataTableScroll } from '../../shared/ui/DataTableSection'
import { EmptyState } from '../../shared/ui/EmptyState'
import { SectionHeader } from '../../shared/ui/SectionHeader'
import './admin.css'

type Tab = 'attendance' | 'members' | 'teams' | 'audit'

const ALL_ROLES: UserRole[] = ['MEMBER', 'TEAM_LEAD', 'ADMIN']
const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  TEAM_LEAD: '팀장',
  MEMBER: '멤버',
}

const auditActionLabels: Record<string, string> = {
  ROLE_CHANGE: '역할 변경',
  TEAM_CHANGE: '팀 변경',
  DEACTIVATE: '비활성화',
  ACTIVATE: '활성화',
}

function formatAuditDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function Admin() {
  const { state, loadMembers, refreshMembers, refreshTeams } = useApp()
  const [tab, setTab] = useState<Tab>('attendance')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string; current: UserRole } | null>(null)
  const [changeTeamFor, setChangeTeamFor] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEMBER')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [newTeamName, setNewTeamName] = useState('')

  const todayStr = getTodayStr()
  const members = sortUsersByTeamAndName(state.users)
  const teamOptions = getTeamOptions(members, state.teams)

  const loadAuditLogList = async () => {
    setAuditLoading(true)
    try {
      const logs = await getAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '감사 로그를 불러오지 못했습니다')
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    getAttendanceByDate(todayStr)
      .then((attendanceList) => {
        setRecords(attendanceList)
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '관리 데이터를 불러오지 못했습니다'))
  }, [todayStr])

  useEffect(() => {
    if (tab !== 'audit') return
    void loadAuditLogList()
  }, [tab])

  const reloadMembersAndTeams = async () => {
    const [memberList] = await Promise.all([
      refreshMembers(),
      refreshTeams(),
    ])
    loadMembers(memberList)
  }

  const handleOpenRoleChange = (id: string, name: string, current: UserRole) => {
    const targetMember = members.find((member) => member.id === id)
    if (!canManageMemberRolesFor(state.currentUser, targetMember)) {
      setErrorMessage('본인 계정의 역할은 변경할 수 없습니다')
      return
    }

    setChangeRoleFor({ id, name, current })
    setSelectedRole(current)
  }

  const handleConfirmRoleChange = async () => {
    if (!changeRoleFor) return

    setSaving(true)
    try {
      await updateMemberRole(changeRoleFor.id, selectedRole)
      await refreshMembers()
      setSuccessMessage(`${changeRoleFor.name}의 역할을 ${roleLabels[selectedRole]}로 변경했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '역할 변경에 실패했습니다')
    }
    setSaving(false)
    setChangeRoleFor(null)
  }

  const handleDeactivate = async (id: string) => {
    const targetMember = members.find((member) => member.id === id)
    if (!canManageMemberStatusFor(state.currentUser, targetMember)) {
      setErrorMessage('본인 계정은 비활성화할 수 없습니다')
      return
    }

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
      await reloadMembersAndTeams()
      setSuccessMessage(`${member?.name ?? '선택한 멤버'}를 퇴출 처리했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '퇴출에 실패했습니다')
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    const targetMember = members.find((member) => member.id === id)
    if (!canManageMemberStatusFor(state.currentUser, targetMember)) {
      setErrorMessage('본인 계정은 활성화 상태를 변경할 수 없습니다')
      return
    }

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
    if (!canChangeMemberTeamFor(state.currentUser, member)) {
      setErrorMessage('본인 계정의 팀은 여기서 변경할 수 없습니다')
      return
    }

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
      await refreshTeams()
      setNewTeamName('')
      setSuccessMessage(`${trimmed}을 생성했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 생성에 실패했습니다')
    }
    setSaving(false)
  }

  const handleDeleteTeam = async (team: TeamResponse) => {
    if (team.name === DEFAULT_SIGNUP_TEAM_NAME) {
      setErrorMessage('신입 팀은 삭제할 수 없습니다')
      return
    }

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
      await refreshTeams()
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
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'audit' ? 'active' : ''}`}
          onClick={() => setTab('audit')}
        >
          감사 로그
        </button>
      </div>

      {tab === 'attendance' && (
        <div className="admin-tab-content glass">
          <TeamAttendanceStatus members={members} records={records} date={todayStr} />
        </div>
      )}

      {tab === 'members' && (
        <div className="admin-tab-content glass">
          <SectionHeader
            title="멤버 목록"
            description="역할, 상태, 팀 이동, 퇴출 액션을 한 곳에서 관리합니다."
          />
          <MemberManagementTable
            members={members}
            saving={saving}
            showStatus
            showActions
            onOpenRoleChange={(member) => handleOpenRoleChange(member.id, member.name, member.role)}
            onOpenTeamChange={handleOpenTeamChange}
            onDeactivate={handleDeactivate}
            onActivate={handleActivate}
            onExpel={handleExpel}
            canManageRoleFor={(member) => canManageMemberRolesFor(state.currentUser, member)}
            canChangeTeamFor={(member) => canChangeMemberTeamFor(state.currentUser, member)}
            canManageStatusFor={(member) => canManageMemberStatusFor(state.currentUser, member)}
            canExpelFor={(member) => canExpelMembersFor(state.currentUser, member)}
          />
        </div>
      )}

      {tab === 'teams' && (
        <div className="admin-tab-content glass">
          <div className="admin-team-manager-head">
            <SectionHeader
              title="팀 목록"
              description="새 팀을 추가하거나 더 이상 사용하지 않는 팀을 삭제할 수 있습니다."
            />
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
                      disabled={saving || team.name === DEFAULT_SIGNUP_TEAM_NAME}
                      onClick={() => handleDeleteTeam(team)}
                    >
                      <Trash2 size={14} />
                      {team.name === DEFAULT_SIGNUP_TEAM_NAME ? '삭제 불가' : '삭제'}
                    </button>
                  </div>
                  <div className="admin-team-card-body">
                    <span className="admin-team-count">
                      <Users size={14} />
                      소속 멤버 {memberCount}명
                    </span>
                    <p>
                      {team.name === DEFAULT_SIGNUP_TEAM_NAME
                        ? '신입 팀은 신규 가입자의 기본 배정 팀이라 삭제할 수 없습니다.'
                        : '팀 삭제 전 멤버 이동이 필요한 경우 멤버 관리에서 먼저 팀을 변경해 주세요.'}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="admin-tab-content glass">
          <SectionHeader
            title="감사 로그"
            description="권한과 상태 변경 이력을 최신순으로 확인합니다."
            actions={(
              <button
                type="button"
                className="admin-export-btn glass"
                onClick={() => void loadAuditLogList()}
                disabled={auditLoading}
              >
                <History size={16} />
                {auditLoading ? '불러오는 중...' : '새로고침'}
              </button>
            )}
          />

          {auditLogs.length === 0 ? (
            <EmptyState
              compact
              title={auditLoading ? '감사 로그를 불러오는 중입니다.' : '표시할 감사 로그가 없습니다.'}
              description="역할 변경, 팀 변경, 활성화/비활성화 이력이 쌓이면 이곳에서 확인할 수 있습니다."
            />
          ) : (
            <DataTableScroll className="admin-audit-table-wrap">
              <table className="admin-audit-table">
                <colgroup>
                  <col className="admin-audit-time-col" />
                  <col className="admin-audit-actor-col" />
                  <col className="admin-audit-action-col" />
                  <col className="admin-audit-target-col" />
                  <col className="admin-audit-before-col" />
                  <col className="admin-audit-after-col" />
                </colgroup>
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>수행자</th>
                    <th>액션</th>
                    <th>대상</th>
                    <th>변경 전</th>
                    <th>변경 후</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatAuditDateTime(log.createdAt)}</td>
                      <td>{log.actorRole}</td>
                      <td>{auditActionLabels[log.action] ?? log.action}</td>
                      <td>{log.targetId}</td>
                      <td>{log.previousValue ?? '-'}</td>
                      <td>{log.newValue ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableScroll>
          )}
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
