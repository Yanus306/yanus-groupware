import { useState, useEffect } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { TeamAttendanceStatus } from '../../features/attendance/ui'
import { LeaveSection } from '../../features/leave/ui/LeaveSection'
import {
  getAttendanceByDate,
  getAttendanceByDates,
  getMyAttendance,
  getAllWorkSchedules,
  getTeamWorkSchedules,
} from '../../shared/api/attendanceApi'
import type { AttendanceRecord, MemberWorkScheduleItem } from '../../shared/api/attendanceApi'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { sortUsersByTeamAndName } from '../../shared/lib/team'
import { DataTableScroll, DataTableSection } from '../../shared/ui/DataTableSection'
import { Toast } from '../../shared/ui/Toast'
import { canViewManagedAttendance } from '../../shared/lib/permissions'
import {
  formatDateRangeLabel,
  formatDateRangeToken,
  getDateStringsBetween,
  getMonthRange,
  getTodayStr,
  getWeekRange,
} from '../../shared/lib/date'
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

function dedupeAndSortRecords(records: AttendanceRecord[]) {
  const unique = new Map<string, AttendanceRecord>()
  records.forEach((record) => {
    unique.set(`${record.id}-${record.memberId}-${record.workDate}`, record)
  })

  return Array.from(unique.values()).sort((left, right) => {
    if (left.workDate !== right.workDate) {
      return right.workDate.localeCompare(left.workDate)
    }
    const nameOrder = left.memberName.localeCompare(right.memberName, 'ko')
    if (nameOrder !== 0) {
      return nameOrder
    }
    return right.id - left.id
  })
}

export function Attendance() {
  const { state } = useApp()
  const [filter, setFilter] = useState<'week' | 'month' | 'custom'>('month')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([])
  const [teamSchedules, setTeamSchedules] = useState<MemberWorkScheduleItem[]>([])
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeRange, setActiveRange] = useState(() => {
    const today = getTodayStr()
    const monthRange = getMonthRange(today)
    return {
      start: monthRange.start,
      end: monthRange.end,
      label: formatDateRangeLabel(monthRange.start, monthRange.end),
      token: formatDateRangeToken(monthRange.start, monthRange.end),
    }
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const PAGE_SIZE = 10

  const todayStr = getTodayStr()
  const isAdmin = state.currentUser?.role === 'ADMIN'
  const canSeeManagedAttendance = canViewManagedAttendance(state.currentUser)
  const members = sortUsersByTeamAndName(
    state.currentUser?.role === 'TEAM_LEAD'
      ? state.users.filter((member) => member.team === state.currentUser?.team)
      : state.users,
  )
  const usersScopeKey = state.users
    .map((member) => `${member.id}:${member.team}:${member.status}:${member.role}`)
    .join('|')
  const teamsScopeKey = state.teams
    .map((team) => `${team.id}:${team.name}`)
    .join('|')

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

  const filterRecordsByScope = (attendanceList: AttendanceRecord[]) => {
    if (!canSeeManagedAttendance || !state.currentUser) return

    if (state.currentUser.role === 'ADMIN') {
      return dedupeAndSortRecords(attendanceList)
    }

    const currentTeam = state.currentUser.team
    const memberIds = new Set(
      state.users
        .filter((member) => member.team === currentTeam)
        .map((member) => Number(member.id)),
    )

    return dedupeAndSortRecords(attendanceList.filter((record) => memberIds.has(record.memberId)))
  }

  const loadTodayManagedAttendance = async () => {
    if (!canSeeManagedAttendance || !state.currentUser) return

    try {
      const attendanceList = await getAttendanceByDate(todayStr)
      setTodayRecords(filterRecordsByScope(attendanceList) ?? [])
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '오늘 출퇴근 기록을 불러오지 못했습니다')
    }
  }

  const loadManagedAttendanceRange = async (startDate: string, endDate: string) => {
    if (!canSeeManagedAttendance || !state.currentUser) return

    try {
      const dates = getDateStringsBetween(startDate, endDate)
      const attendanceList = await getAttendanceByDates(dates)
      setRecords(filterRecordsByScope(attendanceList) ?? [])
      setActiveRange({
        start: startDate,
        end: endDate,
        label: formatDateRangeLabel(startDate, endDate),
        token: formatDateRangeToken(startDate, endDate),
      })
      setPage(1)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '출퇴근 기록을 불러오지 못했습니다')
    }
  }

  useEffect(() => {
    loadTodayManagedAttendance()
  }, [canSeeManagedAttendance, todayStr, state.currentUser?.id, state.currentUser?.team, usersScopeKey])

  useEffect(() => {
    if (!canSeeManagedAttendance) return

    if (filter === 'week') {
      const range = getWeekRange(todayStr)
      setDateFrom(range.start)
      setDateTo(range.end)
      loadManagedAttendanceRange(range.start, range.end)
      return
    }

    if (filter === 'month') {
      const range = getMonthRange(todayStr)
      setDateFrom(range.start)
      setDateTo(range.end)
      loadManagedAttendanceRange(range.start, range.end)
    }
  }, [filter, canSeeManagedAttendance, todayStr, state.currentUser?.id, state.currentUser?.team, usersScopeKey])

  useEffect(() => {
    getMyAttendance()
      .then(setMyRecords)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '내 출퇴근 이력을 불러오지 못했습니다'))
  }, [])

  useEffect(() => {
    loadTeamSchedules()
  }, [canSeeManagedAttendance, state.currentUser?.id, state.currentUser?.role, state.currentUser?.team, teamsScopeKey])

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getScheduledDays = (memberId: number) => {
    const memberSchedule = teamSchedules.find((schedule) => schedule.memberId === memberId)
    return new Set(memberSchedule?.workSchedules.map((schedule) => schedule.dayOfWeek) ?? [])
  }

  const handleDateFilter = () => {
    if (!dateFrom || !dateTo) {
      setErrorMessage('조회 시작일과 종료일을 모두 선택해 주세요')
      return
    }

    if (dateFrom > dateTo) {
      setErrorMessage('시작일이 종료일보다 늦을 수 없습니다')
      return
    }

    loadManagedAttendanceRange(dateFrom, dateTo)
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
      activeRange.token
    )
  }

  return (
    <div className="attendance-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}
      <header className="attendance-header">
        <div className="attendance-header-copy">
          <p>오늘 근무 현황과 출퇴근 이력을 한 화면에서 확인합니다.</p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button className="export-btn glass" onClick={handleExport}>
              <Download size={18} />
              CSV 내보내기
            </button>
          )}
          <div className="date-range glass">{activeRange.label}</div>
          <div className="filter-tabs">
            <button className={filter === 'week' ? 'active' : ''} onClick={() => setFilter('week')}>
              이번 주
            </button>
            <button className={filter === 'month' ? 'active' : ''} onClick={() => setFilter('month')}>
              이번 달
            </button>
            <button
              className={filter === 'custom' ? 'active' : ''}
              onClick={() => {
                if (!dateFrom || !dateTo) {
                  setDateFrom(todayStr)
                  setDateTo(todayStr)
                }
                setFilter('custom')
              }}
            >
              직접 선택
            </button>
          </div>
          {filter === 'custom' && (
            <div className="custom-date-filter">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="date-input"
                aria-label="조회 시작일"
              />
              <span className="date-range-separator">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="date-input"
                aria-label="조회 종료일"
              />
              <button className="filter-apply-btn" onClick={handleDateFilter}>조회</button>
            </div>
          )}
        </div>
      </header>

      <div className="attendance-content">
        {canSeeManagedAttendance && members.length > 0 && (
          <section className="team-status-section glass">
            <TeamAttendanceStatus members={members} records={todayRecords} date={todayStr} />
          </section>
        )}

        {canSeeManagedAttendance && (
          <div className="two-cards-row admin-wide">
            <DataTableSection
              className="records-section"
              title="출퇴근 기록"
              description={`${activeRange.label} 기준으로 관리 대상 멤버의 근무 일정과 출퇴근 상태를 확인합니다.`}
            >
              <DataTableScroll className="records-table-wrap">
                <table className="records-table">
                  <colgroup>
                    <col className="records-member-col" />
                    <col className="records-scheduled-col" />
                    <col className="records-time-col" />
                    <col className="records-time-col" />
                    <col className="records-date-col" />
                    <col className="records-status-col" />
                  </colgroup>
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
              </DataTableScroll>
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={18} /></button>
                <span>{page} / {totalPages} 페이지</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={18} /></button>
              </div>
            </DataTableSection>
          </div>
        )}

        {/* 내 출퇴근 이력 — 모든 유저 */}
        <DataTableSection
          className="my-history-section"
          title="내 출퇴근 이력"
          description="개인 출퇴근 기록을 최근 순서대로 확인할 수 있습니다."
        >
          <DataTableScroll className="records-table-wrap">
            <table className="records-table">
              <colgroup>
                <col className="my-records-date-col" />
                <col className="my-records-time-col" />
                <col className="my-records-time-col" />
                <col className="my-records-status-col" />
              </colgroup>
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
          </DataTableScroll>
        </DataTableSection>

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
