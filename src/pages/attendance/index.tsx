import { useState, useEffect } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { SetWorkDaysPersonal, TeamAttendanceStatus, TeamWorkSchedulePanel } from '../../features/attendance/ui'
import { LeaveSection } from '../../features/leave/ui/LeaveSection'
import {
  getAttendanceByDate,
  getMyAttendance,
  getAllWorkSchedules,
  getTeamWorkSchedules,
} from '../../shared/api/attendanceApi'
import type { AttendanceRecord, MemberWorkScheduleItem } from '../../shared/api/attendanceApi'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { sortUsersByTeamAndName } from '../../shared/lib/team'
import { Toast } from '../../shared/ui/Toast'
import { canViewManagedAttendance } from '../../shared/lib/permissions'
import './attendance.css'

const DAY_LABELS: Record<string, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
}

const ORDERED_WORK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

const ATTENDANCE_STATUS_LABEL = {
  LEFT: '퇴근',
  WORKING: '근무 중',
} as const

export function Attendance() {
  const { state } = useApp()
  const [filter, setFilter] = useState<'week' | 'month' | 'custom'>('month')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([])
  const [teamSchedules, setTeamSchedules] = useState<MemberWorkScheduleItem[]>([])
  const [page, setPage] = useState(1)
  const [dateInput, setDateInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const PAGE_SIZE = 10

  const todayStr = new Date().toISOString().slice(0, 10)
  const isAdmin = state.currentUser?.role === 'ADMIN'
  const canSeeManagedAttendance = canViewManagedAttendance(state.currentUser)
  const members = sortUsersByTeamAndName(
    state.currentUser?.role === 'TEAM_LEAD'
      ? state.users.filter((member) => member.team === state.currentUser?.team)
      : state.users,
  )

  const loadTeamSchedules = async () => {
    if (!canSeeManagedAttendance || !state.currentUser) return

    try {
      if (state.currentUser.role === 'ADMIN') {
        const schedules = await getAllWorkSchedules()
        setTeamSchedules(schedules)
        return
      }

      if (state.currentUser.role === 'TEAM_LEAD') {
        const currentTeam = state.teams.find((team) => team.name === state.currentUser?.team)
        if (!currentTeam) {
          setTeamSchedules([])
          return
        }
        const schedules = await getTeamWorkSchedules(currentTeam.id)
        setTeamSchedules(schedules)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '팀 근무 일정을 불러오지 못했습니다')
    }
  }

  const loadManagedAttendance = async (targetDate: string) => {
    if (!canSeeManagedAttendance || !state.currentUser) return

    try {
      const attendanceList = await getAttendanceByDate(targetDate)
      if (state.currentUser.role === 'ADMIN') {
        setRecords(attendanceList)
        return
      }

      const currentTeam = state.currentUser.team
      const memberIds = new Set(
        state.users
          .filter((member) => member.team === currentTeam)
          .map((member) => Number(member.id)),
      )
      setRecords(attendanceList.filter((record) => memberIds.has(record.memberId)))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '출퇴근 기록을 불러오지 못했습니다')
    }
  }

  // 관리자/팀장: 날짜별 관리 대상 기록 + 멤버 목록
  useEffect(() => {
    loadManagedAttendance(todayStr)
  }, [canSeeManagedAttendance, todayStr, state.currentUser?.id, state.currentUser?.team, state.users])

  // 일반 사용자: 내 출퇴근 기록 전체 이력
  useEffect(() => {
    getMyAttendance()
      .then(setMyRecords)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '내 출퇴근 이력을 불러오지 못했습니다'))
  }, [])

  useEffect(() => {
    loadTeamSchedules()
  }, [canSeeManagedAttendance, state.currentUser, state.teams])

  const todayRecords = records.filter((r) => r.workDate === todayStr)
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getScheduledDays = (memberId: number) => {
    const memberSchedule = teamSchedules.find((schedule) => schedule.memberId === memberId)
    return new Set(memberSchedule?.workSchedules.map((schedule) => schedule.dayOfWeek) ?? [])
  }

  const handleDateFilter = () => {
    if (!dateInput) return
    loadManagedAttendance(dateInput)
  }

  const handleExport = () => {
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
      todayStr
    )
  }

  return (
    <div className="attendance-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      <header className="attendance-header">
        <div className="attendance-header-copy">
          <p>오늘 근무 현황과 개인 근무 일정을 한 화면에서 관리합니다.</p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button className="export-btn glass" onClick={handleExport}>
              <Download size={18} />
              CSV 내보내기
            </button>
          )}
          <div className="date-range glass">{todayStr}</div>
          <div className="filter-tabs">
            <button className={filter === 'week' ? 'active' : ''} onClick={() => setFilter('week')}>
              이번 주
            </button>
            <button className={filter === 'month' ? 'active' : ''} onClick={() => setFilter('month')}>
              이번 달
            </button>
            <button className={filter === 'custom' ? 'active' : ''} onClick={() => setFilter('custom')}>
              직접 선택
            </button>
          </div>
          {filter === 'custom' && (
            <div className="custom-date-filter">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="date-input"
              />
              <button className="filter-apply-btn" onClick={handleDateFilter}>조회</button>
            </div>
          )}
        </div>
      </header>

      <div className="attendance-content">
        {canSeeManagedAttendance && members.length > 0 && (
          <section className="team-status-section glass">
            <TeamAttendanceStatus members={members} records={records} date={todayStr} />
          </section>
        )}

        {canSeeManagedAttendance && (
          <section className="team-schedule-section glass">
            <TeamWorkSchedulePanel
              schedules={teamSchedules}
              title={state.currentUser?.role === 'ADMIN' ? '전체 근무 일정' : '팀 근무 일정'}
            />
          </section>
        )}

        <div className={`two-cards-row ${canSeeManagedAttendance ? 'admin-wide' : 'single'}`}>
          <section className="set-work-days-section glass">
            <SetWorkDaysPersonal onSaved={loadTeamSchedules} />
          </section>
          {canSeeManagedAttendance && (
            <section className="records-section glass">
              <h3>출퇴근 기록</h3>
              <div className="records-table-wrap">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>멤버 ↕</th>
                      <th>근무 일정</th>
                      <th>출근</th>
                      <th>퇴근</th>
                      <th>날짜</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((r) => (
                      <tr key={r.id} className={r.status === 'WORKING' ? 'late' : ''}>
                        <td>
                          <span className="record-avatar">{r.memberName[0]}</span>
                          {r.memberName}
                        </td>
                        <td data-testid={`scheduled-days-${r.memberId}`}>
                          {ORDERED_WORK_DAYS.map((dayOfWeek) => {
                            const scheduledDays = getScheduledDays(r.memberId)
                            const isScheduled = scheduledDays.has(dayOfWeek)
                            const dayLabel = DAY_LABELS[dayOfWeek]

                            return (
                              <span
                                key={`${r.memberId}-${dayOfWeek}`}
                                className={`dot ${isScheduled ? 'on' : ''}`}
                                title={`${dayLabel} ${isScheduled ? '근무 예정' : '휴무'}`}
                                aria-label={`${dayLabel} ${isScheduled ? '근무 예정' : '휴무'}`}
                              />
                            )
                          })}
                        </td>
                        <td>{r.checkInTime?.slice(11, 16) ?? '-'}</td>
                        <td>{r.checkOutTime?.slice(11, 16) ?? '-'}</td>
                        <td>{r.workDate}</td>
                        <td>
                          <span className={`status-badge ${r.status === 'LEFT' ? 'present' : 'late'}`}>
                            {ATTENDANCE_STATUS_LABEL[r.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={18} /></button>
                <span>{page} / {totalPages} 페이지</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={18} /></button>
              </div>
            </section>
          )}
        </div>

        {/* 내 출퇴근 이력 — 모든 유저 */}
        <section className="my-history-section glass">
          <h3>내 출퇴근 이력</h3>
          <div className="records-table-wrap">
            <table className="records-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>출근</th>
                  <th>퇴근</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.length === 0 ? (
                  <tr><td colSpan={4} className="records-empty">기록이 없습니다</td></tr>
                ) : (
                  myRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{r.workDate}</td>
                      <td>{r.checkInTime?.slice(11, 16) ?? '-'}</td>
                      <td>{r.checkOutTime?.slice(11, 16) ?? '-'}</td>
                      <td>
                        <span className={`status-badge ${r.status === 'LEFT' ? 'present' : 'late'}`}>
                          {ATTENDANCE_STATUS_LABEL[r.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {canSeeManagedAttendance && (
          <div className="summary-stats">
            <div className="stat-card glass">
              <span className="label">오늘 총 기록</span>
              <span className="value">{todayRecords.length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">퇴근</span>
              <span className="value green">{todayRecords.filter((r) => r.status === 'LEFT').length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">근무 중</span>
              <span className="value yellow">{todayRecords.filter((r) => r.status === 'WORKING').length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">미출근</span>
              <span className="value red">{todayRecords.filter((r) => r.checkInTime === null).length}</span>
            </div>
          </div>
        )}

        {/* 휴가 신청 — 모든 유저 */}
        <section className="leave-section-wrap glass">
          <LeaveSection />
        </section>
      </div>
    </div>
  )
}
