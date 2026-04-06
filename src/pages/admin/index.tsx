import { useState, useEffect, useMemo } from 'react'
import { Crown, Download, FolderPlus, History, Trash2, Users } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { TeamAttendanceStatus } from '../../features/attendance/ui'
import { getAttendanceByDate, getAttendanceByDates } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import { getMonthlyAttendanceSettlement } from '../../shared/api/attendanceSettlementApi'
import type { AttendanceSettlement } from '../../shared/api/attendanceSettlementApi'
import { getAuditLogs } from '../../shared/api/auditLogsApi'
import type { AuditLog } from '../../shared/api/auditLogsApi'
import {
  updateMemberRole,
  deactivateMember,
  activateMember,
  updateMemberTeam,
  resetMemberPassword,
} from '../../shared/api/membersApi'
import type { User, UserRole } from '../../entities/user/model/types'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { Toast } from '../../shared/ui/Toast'
import { getDateStringsBetween, getMonthRange, getTodayStr } from '../../shared/lib/date'
import {
  applyNoScheduleAttendanceFee,
  rollupAttendanceSettlements,
} from '../../shared/lib/attendanceSettlement'
import type { AttendanceSettlementRollup } from '../../shared/lib/attendanceSettlement'
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

type Tab = 'attendance' | 'members' | 'teams' | 'audit' | 'settlement'
type SettlementView = 'overall' | 'team' | 'member'

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

const settlementStatusLabels: Record<string, string> = {
  ON_TIME: '정상 출근',
  LATE: '지각',
  ABSENT: '미출근',
  NO_SCHEDULE: '근무 일정 없음',
}

function formatAuditDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

function formatTime(value: string | null) {
  return value ? value.slice(11, 16) : '-'
}

interface TeamSettlementGroup {
  teamName: string
  settlements: AttendanceSettlement[]
  summary: AttendanceSettlementRollup
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
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [exportingSettlementAttendance, setExportingSettlementAttendance] = useState(false)
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string; current: UserRole } | null>(null)
  const [changeTeamFor, setChangeTeamFor] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEMBER')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [resetPasswordResult, setResetPasswordResult] = useState<{ name: string; temporaryPassword: string } | null>(null)
  const [settlementView, setSettlementView] = useState<SettlementView>('overall')
  const [selectedSettlementTeamName, setSelectedSettlementTeamName] = useState('')
  const [selectedSettlementMemberId, setSelectedSettlementMemberId] = useState<string>('')
  const [selectedSettlementMonth, setSelectedSettlementMonth] = useState(getTodayStr().slice(0, 7))
  const [settlements, setSettlements] = useState<AttendanceSettlement[]>([])
  const [settlementAttendanceRecords, setSettlementAttendanceRecords] = useState<AttendanceRecord[]>([])

  const todayStr = getTodayStr()
  const members = useMemo(() => sortUsersByTeamAndName(state.users), [state.users])
  const teamOptions = useMemo(() => getTeamOptions(members, state.teams), [members, state.teams])
  const settlementMemberOptions = useMemo(
    () => members.filter((member) => member.status !== 'INACTIVE'),
    [members],
  )
  const settlementTeamOptions = useMemo(() => {
    const activeTeamNames = new Set(settlementMemberOptions.map((member) => member.team))
    return teamOptions
      .filter((team) => activeTeamNames.has(team.name))
      .map((team) => team.name)
  }, [settlementMemberOptions, teamOptions])
  const settlement = settlements.find((item) => String(item.memberId) === selectedSettlementMemberId) ?? null
  const settlementSummary = useMemo(() => rollupAttendanceSettlements(settlements), [settlements])
  const teamSettlementGroups = useMemo<TeamSettlementGroup[]>(
    () => settlementTeamOptions.map((teamName) => {
      const teamMemberSettlements = settlements.filter((item) => item.teamName === teamName)
      return {
        teamName,
        settlements: teamMemberSettlements,
        summary: rollupAttendanceSettlements(teamMemberSettlements),
      }
    }),
    [settlementTeamOptions, settlements],
  )
  const selectedTeamSettlement = teamSettlementGroups.find((item) => item.teamName === selectedSettlementTeamName) ?? null
  const selectedMemberNoScheduleCount = settlement?.items.filter(
    (item) => item.status === 'NO_SCHEDULE' && item.fee > 0,
  ).length ?? 0

  useEffect(() => {
    if (!selectedSettlementMemberId) return
    if (settlementMemberOptions.some((member) => member.id === selectedSettlementMemberId)) return
    setSelectedSettlementMemberId('')
  }, [selectedSettlementMemberId, settlementMemberOptions])

  useEffect(() => {
    if (!selectedSettlementTeamName) return
    if (settlementTeamOptions.includes(selectedSettlementTeamName)) return
    setSelectedSettlementTeamName('')
  }, [selectedSettlementTeamName, settlementTeamOptions])

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

  useEffect(() => {
    if (tab !== 'settlement' || settlementMemberOptions.length === 0) return

    setSettlementLoading(true)
    const monthAnchor = `${selectedSettlementMonth}-01`
    const { start, end } = getMonthRange(monthAnchor)
    const dates = getDateStringsBetween(start, end)

    Promise.all([
      getAttendanceByDates(dates),
      Promise.all(
        settlementMemberOptions.map(async (member) => {
          const data = await getMonthlyAttendanceSettlement(selectedSettlementMonth, Number(member.id))
          return data
        }),
      ),
    ])
      .then(([monthlyRecords, monthlySettlements]) => {
        setSettlementAttendanceRecords(monthlyRecords)
        setSettlements(
          monthlySettlements.map((item) =>
            applyNoScheduleAttendanceFee(
              item,
              monthlyRecords.filter((record) => String(record.memberId) === String(item.memberId)),
            ),
          ),
        )
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : '월별 지각비 정산을 불러오지 못했습니다')
      })
      .finally(() => {
        setSettlementLoading(false)
      })
  }, [tab, selectedSettlementMonth, settlementMemberOptions])

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

  const handleResetPassword = async (member: User) => {
    if (!canManageMemberStatusFor(state.currentUser, member)) {
      setErrorMessage('본인 계정의 비밀번호는 이 화면에서 초기화할 수 없습니다')
      return
    }

    setSaving(true)
    try {
      const result = await resetMemberPassword(member.id)
      setResetPasswordResult({
        name: member.name,
        temporaryPassword: result.temporaryPassword,
      })
      setSuccessMessage(`${member.name}의 임시 비밀번호를 발급했습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '임시 비밀번호 발급에 실패했습니다')
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

  const handleExportMemberAttendanceCsv = async () => {
    if (!selectedSettlementMemberId) return

    const selectedMember = members.find((member) => member.id === selectedSettlementMemberId)
    if (!selectedMember) return

    setExportingSettlementAttendance(true)
    try {
      const monthAnchor = `${selectedSettlementMonth}-01`
      const { start, end } = getMonthRange(monthAnchor)
      const dates = getDateStringsBetween(start, end)
      const monthlyRecords = settlementAttendanceRecords.length > 0
        ? settlementAttendanceRecords
        : await getAttendanceByDates(dates)
      const targetRecords = monthlyRecords.filter(
        (record) => String(record.memberId) === selectedSettlementMemberId,
      )

      exportAttendanceToCsv(
        targetRecords.map((record) => ({
          id: String(record.id),
          userId: String(record.memberId),
          userName: record.memberName,
          date: record.workDate,
          clockIn: record.checkInTime?.slice(11, 16) ?? '',
          clockOut: record.checkOutTime?.slice(11, 16) ?? '',
          status: record.status === 'LEFT' ? 'done' : 'working',
        })),
        `${selectedSettlementMonth}_${selectedMember.name}`,
      )
      setSuccessMessage(`${selectedMember.name}의 ${selectedSettlementMonth} 출근 내역을 내보냈습니다`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '개인 출근 내역을 내보내지 못했습니다')
    } finally {
      setExportingSettlementAttendance(false)
    }
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
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'settlement' ? 'active' : ''}`}
          onClick={() => setTab('settlement')}
        >
          지각비 정산
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
            onResetPassword={handleResetPassword}
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

      {tab === 'settlement' && (
        <div className="admin-tab-content glass">
          <SectionHeader
            title="월별 지각비 정산"
            description="활성 멤버 기준으로 전체, 팀, 개인 단위 정산을 나눠서 확인할 수 있습니다."
            actions={settlementView === 'member' ? (
              <div className="admin-settlement-actions">
                <button
                  type="button"
                  className="admin-export-btn glass"
                  onClick={() => void handleExportMemberAttendanceCsv()}
                  disabled={exportingSettlementAttendance || !selectedSettlementMemberId}
                >
                  <Download size={16} />
                  {exportingSettlementAttendance ? '내보내는 중...' : '개인 출근 내역 CSV'}
                </button>
              </div>
            ) : undefined}
          />

          <div className="admin-settlement-toolbar">
            <label className="admin-settlement-field">
              <span>정산 월</span>
              <input
                type="month"
                value={selectedSettlementMonth}
                onChange={(event) => setSelectedSettlementMonth(event.target.value)}
              />
            </label>
          </div>

          <div className="admin-settlement-view-tabs" role="tablist" aria-label="지각비 정산 보기">
            <button
              type="button"
              role="tab"
              aria-selected={settlementView === 'overall'}
              className={`admin-tab-btn ${settlementView === 'overall' ? 'active' : ''}`}
              onClick={() => setSettlementView('overall')}
            >
              전체
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={settlementView === 'team'}
              className={`admin-tab-btn ${settlementView === 'team' ? 'active' : ''}`}
              onClick={() => setSettlementView('team')}
            >
              팀
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={settlementView === 'member'}
              className={`admin-tab-btn ${settlementView === 'member' ? 'active' : ''}`}
              onClick={() => setSettlementView('member')}
            >
              개인
            </button>
          </div>

          {settlementLoading ? (
            <EmptyState
              compact
              title="월별 지각비 정산을 불러오는 중입니다."
              description="선택한 월과 멤버 기준으로 출근 기록을 정리하고 있습니다."
            />
          ) : settlements.length === 0 ? (
            <EmptyState
              compact
              title="조회할 정산 데이터가 없습니다."
              description="월과 멤버를 선택하면 지각비 정산 결과가 이곳에 표시됩니다."
            />
          ) : (
            <div className="admin-settlement-content">
              {settlementView === 'overall' && (
                <>
                  <SectionHeader
                    title="전체 정산 요약"
                    description="활성 멤버 전체를 기준으로 월별 지각비를 집계한 결과입니다."
                  />

                  <div className="admin-settlement-summary-grid">
                    <article className="admin-settlement-card">
                      <span className="admin-settlement-label">활성 멤버 수</span>
                      <strong>{settlementSummary.memberCount}명</strong>
                      <p>월별 전체 정산 대상</p>
                    </article>
                    <article className="admin-settlement-card">
                      <span className="admin-settlement-label">월별 전체 지각비</span>
                      <strong>{formatCurrency(settlementSummary.totalLateFee)}</strong>
                      <p>지각 {settlementSummary.lateDays}건 · 총 {settlementSummary.totalLateMinutes}분</p>
                    </article>
                    <article className="admin-settlement-card">
                      <span className="admin-settlement-label">미기재 출근</span>
                      <strong>{settlementSummary.noScheduleAttendanceCount}건</strong>
                      <p>건당 {formatCurrency(3000)} 정산</p>
                    </article>
                  </div>

                  <SectionHeader
                    title="전체 멤버 정산"
                    description="행을 클릭하면 개인 섹션으로 이동해 상세 정산 내역을 확인할 수 있습니다."
                  />

                  <DataTableScroll className="admin-settlement-table-wrap">
                    <table className="admin-settlement-table is-clickable">
                      <thead>
                        <tr>
                          <th>멤버</th>
                          <th>팀</th>
                          <th>근무 일수</th>
                          <th>출근 일수</th>
                          <th>지각 건수</th>
                          <th>지각 분</th>
                          <th>정산 금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlements.map((memberSettlement) => (
                          <tr
                            key={memberSettlement.memberId}
                            onClick={() => {
                              setSelectedSettlementMemberId(String(memberSettlement.memberId))
                              setSettlementView('member')
                            }}
                          >
                            <td>{memberSettlement.memberName}</td>
                            <td>{formatTeamName(memberSettlement.teamName)}</td>
                            <td>{memberSettlement.scheduledDays}일</td>
                            <td>{memberSettlement.attendedDays}일</td>
                            <td>{memberSettlement.lateDays}건</td>
                            <td>{memberSettlement.totalLateMinutes}분</td>
                            <td>{formatCurrency(memberSettlement.lateFee)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataTableScroll>
                </>
              )}

              {settlementView === 'team' && (
                <>
                  <div className="admin-settlement-toolbar">
                    <label className="admin-settlement-field">
                      <span>팀 선택</span>
                      <select
                        value={selectedSettlementTeamName}
                        onChange={(event) => setSelectedSettlementTeamName(event.target.value)}
                      >
                        <option value="">팀을 선택해 주세요</option>
                        {settlementTeamOptions.map((teamName) => (
                          <option key={teamName} value={teamName}>
                            {formatTeamName(teamName)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {!selectedTeamSettlement ? (
                    <EmptyState
                      compact
                      title="팀 정산 대상을 선택해 주세요."
                      description="팀을 선택하면 해당 팀의 월별 지각비 요약과 멤버별 정산 결과가 표시됩니다."
                    />
                  ) : (
                    <>
                      <SectionHeader
                        title={`${formatTeamName(selectedTeamSettlement.teamName)} 정산 요약`}
                        description={`${selectedSettlementMonth} 기준 팀 단위 지각비 집계입니다.`}
                      />

                      <div className="admin-settlement-summary-grid">
                        <article className="admin-settlement-card">
                          <span className="admin-settlement-label">팀 활성 멤버 수</span>
                          <strong>{selectedTeamSettlement.summary.memberCount}명</strong>
                          <p>{formatTeamName(selectedTeamSettlement.teamName)} 소속 기준</p>
                        </article>
                        <article className="admin-settlement-card">
                          <span className="admin-settlement-label">팀 전체 지각비</span>
                          <strong>{formatCurrency(selectedTeamSettlement.summary.totalLateFee)}</strong>
                          <p>지각 {selectedTeamSettlement.summary.lateDays}건 · 총 {selectedTeamSettlement.summary.totalLateMinutes}분</p>
                        </article>
                        <article className="admin-settlement-card">
                          <span className="admin-settlement-label">미기재 출근</span>
                          <strong>{selectedTeamSettlement.summary.noScheduleAttendanceCount}건</strong>
                          <p>건당 {formatCurrency(3000)} 정산</p>
                        </article>
                      </div>

                      <SectionHeader
                        title="팀 멤버 정산"
                        description="행을 클릭하면 개인 섹션으로 이동해 해당 멤버의 상세 정산을 확인할 수 있습니다."
                      />

                      <DataTableScroll className="admin-settlement-table-wrap">
                        <table className="admin-settlement-table is-clickable">
                          <thead>
                            <tr>
                              <th>멤버</th>
                              <th>근무 일수</th>
                              <th>출근 일수</th>
                              <th>지각 건수</th>
                              <th>지각 분</th>
                              <th>정산 금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTeamSettlement.settlements.map((memberSettlement) => (
                              <tr
                                key={memberSettlement.memberId}
                                onClick={() => {
                                  setSelectedSettlementMemberId(String(memberSettlement.memberId))
                                  setSettlementView('member')
                                }}
                              >
                                <td>{memberSettlement.memberName}</td>
                                <td>{memberSettlement.scheduledDays}일</td>
                                <td>{memberSettlement.attendedDays}일</td>
                                <td>{memberSettlement.lateDays}건</td>
                                <td>{memberSettlement.totalLateMinutes}분</td>
                                <td>{formatCurrency(memberSettlement.lateFee)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DataTableScroll>
                    </>
                  )}
                </>
              )}

              {settlementView === 'member' && (
                <>
                  <div className="admin-settlement-toolbar">
                    <label className="admin-settlement-field">
                      <span>상세 멤버</span>
                      <select
                        value={selectedSettlementMemberId}
                        onChange={(event) => setSelectedSettlementMemberId(event.target.value)}
                      >
                        <option value="">멤버를 선택해 주세요</option>
                        {settlementMemberOptions.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {!settlement ? (
                    <EmptyState
                      compact
                      title="개인 정산 대상을 선택해 주세요."
                      description="멤버를 선택하면 월별 지각비 상세 내역과 개인 출근 CSV 내보내기를 사용할 수 있습니다."
                    />
                  ) : (
                    <>
                      <SectionHeader
                        title={`${settlement.memberName} 상세 정산`}
                        description={`${selectedSettlementMonth} 기준 개인 지각비 상세 내역입니다.`}
                      />

                      <div className="admin-settlement-summary-grid">
                        <article className="admin-settlement-card">
                          <span className="admin-settlement-label">소속 팀</span>
                          <strong>{formatTeamName(settlement.teamName)}</strong>
                          <p>근무 {settlement.scheduledDays}일 · 출근 {settlement.attendedDays}일</p>
                        </article>
                        <article className="admin-settlement-card">
                          <span className="admin-settlement-label">개인 지각비</span>
                          <strong>{formatCurrency(settlement.lateFee)}</strong>
                          <p>지각 {settlement.lateDays}건 · 총 {settlement.totalLateMinutes}분</p>
                        </article>
                        <article className="admin-settlement-card">
                          <span className="admin-settlement-label">미기재 출근</span>
                          <strong>{selectedMemberNoScheduleCount}건</strong>
                          <p>건당 {formatCurrency(3000)} 정산</p>
                        </article>
                      </div>

                      {settlement.items.length === 0 ? (
                        <EmptyState
                          compact
                          title="선택한 월의 정산 상세 내역이 없습니다."
                          description="근무 일정과 출근 기록이 있으면 날짜별 지각비 내역이 표시됩니다."
                        />
                      ) : (
                        <DataTableScroll className="admin-settlement-table-wrap">
                          <table className="admin-settlement-table">
                            <thead>
                              <tr>
                                <th>날짜</th>
                                <th>예정 출근</th>
                                <th>예정 퇴근</th>
                                <th>실제 출근</th>
                                <th>실제 퇴근</th>
                                <th>지각 분</th>
                                <th>지각비</th>
                                <th>상태</th>
                              </tr>
                            </thead>
                            <tbody>
                              {settlement.items.map((item) => (
                                <tr key={`${item.date}-${item.scheduledStartTime}`}>
                                  <td>{item.date}</td>
                                  <td>{item.scheduledStartTime ? item.scheduledStartTime.slice(0, 5) : '-'}</td>
                                  <td>{item.scheduledEndTime ? item.scheduledEndTime.slice(0, 5) : '-'}</td>
                                  <td>{formatTime(item.checkInTime)}</td>
                                  <td>{formatTime(item.checkOutTime)}</td>
                                  <td>{item.lateMinutes}분</td>
                                  <td>{formatCurrency(item.fee)}</td>
                                  <td>
                                    <span className={`admin-settlement-status ${item.status}`}>
                                      {settlementStatusLabels[item.status] ?? item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </DataTableScroll>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
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

      {resetPasswordResult && (
        <div className="admin-modal-overlay" onClick={() => setResetPasswordResult(null)}>
          <div className="admin-modal glass" onClick={(event) => event.stopPropagation()}>
            <h3>임시 비밀번호가 발급되었습니다</h3>
            <div className="admin-reset-password-result">
              <p>
                <strong>{resetPasswordResult.name}</strong> 계정의 임시 비밀번호입니다.
              </p>
              <code>{resetPasswordResult.temporaryPassword}</code>
              <span>로그인 후 반드시 비밀번호를 변경하도록 안내해 주세요.</span>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="confirm-btn" onClick={() => setResetPasswordResult(null)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
