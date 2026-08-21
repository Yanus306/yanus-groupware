import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { useWorkSession } from '../../features/attendance/model/useWorkSession'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import {
  getAllWorkScheduleEvents,
  getAllWorkSchedules,
  getAttendanceByDate,
  getAttendanceByDates,
  getMyAttendance,
  getMyWorkSchedule,
  getTeamWorkScheduleEvents,
  getTeamWorkSchedules,
  getWorkScheduleEvents,
} from '../../shared/api/attendanceApi'
import type {
  AttendanceRecord,
  MemberWorkScheduleItem,
  WorkScheduleEventItem,
} from '../../shared/api/attendanceApi'
import { canViewManagedAttendance } from '../../shared/lib/permissions'
import { formatDateRangeLabel, formatDateRangeToken, getDateStringsBetween, getTodayStr, getWeekRange } from '../../shared/lib/date'
import { formatWorkScheduleForDate } from '../../shared/lib/attendanceSchedule'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { MemberAttendanceView } from './components/MemberAttendanceView'
import { OperatorAttendanceBoard } from './components/OperatorAttendanceBoard'
import './attendance.css'

type AttendanceFilter = 'today' | 'week' | 'custom'

function getTeamIdForName(
  teamName: string | undefined,
  teams: Array<{ id: number; name: string }> | undefined,
) {
  const matchedTeam = teams?.find((team) => team.name === teamName)
  if (matchedTeam) return matchedTeam.id

  const parsedTeamId = Number.parseInt(teamName ?? '', 10)
  return Number.isFinite(parsedTeamId) ? parsedTeamId : null
}

export function Attendance() {
  const { state } = useApp()
  const workSession = useWorkSession()
  const [filter, setFilter] = useState<AttendanceFilter>('today')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([])
  const [memberScheduleLabel, setMemberScheduleLabel] = useState('일정 확인 중')
  const [managedSchedules, setManagedSchedules] = useState<MemberWorkScheduleItem[]>([])
  const [managedScheduleEvents, setManagedScheduleEvents] = useState<WorkScheduleEventItem[]>([])
  const [dateInput, setDateInput] = useState('')
  const [activeRange, setActiveRange] = useState(() => {
    const today = getTodayStr()
    return { start: today, end: today }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const todayStr = getTodayStr()
  const currentUser = state.currentUser
  const canManageAttendance = canViewManagedAttendance(currentUser)
  const managedTeamId = currentUser?.role === 'TEAM_LEAD'
    ? getTeamIdForName(currentUser.team, state.teams)
    : null
  const activeDate = formatDateRangeLabel(activeRange.start, activeRange.end)

  const filterManagedRecords = useCallback((nextRecords: AttendanceRecord[]) => {
    if (currentUser?.role !== 'TEAM_LEAD') return nextRecords

    const teamMemberIds = new Set(
      state.users
        .filter((user) => user.team === currentUser.team)
        .map((user) => Number(user.id)),
    )
    return nextRecords.filter((record) => teamMemberIds.has(record.memberId))
  }, [currentUser?.role, currentUser?.team, state.users])

  const loadManagedAttendance = useCallback(async (startDate: string, endDate = startDate) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const dates = getDateStringsBetween(startDate, endDate)
      const scheduleRequest = currentUser?.role === 'TEAM_LEAD'
        ? managedTeamId
          ? getTeamWorkSchedules(managedTeamId)
          : Promise.resolve<MemberWorkScheduleItem[]>([])
        : getAllWorkSchedules()
      const scheduleEventRequest = currentUser?.role === 'TEAM_LEAD'
        ? managedTeamId
          ? getTeamWorkScheduleEvents(managedTeamId, startDate, endDate)
          : Promise.resolve<WorkScheduleEventItem[]>([])
        : getAllWorkScheduleEvents(startDate, endDate)
      const [attendanceResult, scheduleResult, scheduleEventResult] = await Promise.allSettled([
        startDate === endDate ? getAttendanceByDate(startDate) : getAttendanceByDates(dates),
        scheduleRequest,
        scheduleEventRequest,
      ])

      if (attendanceResult.status === 'rejected') {
        throw attendanceResult.reason
      }

      setRecords(filterManagedRecords(attendanceResult.value))
      setManagedSchedules(scheduleResult.status === 'fulfilled' ? scheduleResult.value : [])
      setManagedScheduleEvents(scheduleEventResult.status === 'fulfilled' ? scheduleEventResult.value : [])
      setActiveRange({ start: startDate, end: endDate })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '출석 데이터를 불러오지 못했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.role, filterManagedRecords, managedTeamId])

  const loadMemberAttendance = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [attendanceResult, scheduleResult, scheduleEventResult] = await Promise.allSettled([
        getMyAttendance(),
        getMyWorkSchedule(),
        getWorkScheduleEvents(todayStr, todayStr),
      ])

      if (attendanceResult.status === 'rejected') {
        throw attendanceResult.reason
      }

      setMyRecords(attendanceResult.value)
      const schedules = scheduleResult.status === 'fulfilled' ? scheduleResult.value : []
      const events = scheduleEventResult.status === 'fulfilled' ? scheduleEventResult.value : []
      setMemberScheduleLabel(
        scheduleResult.status === 'fulfilled'
          ? formatWorkScheduleForDate(schedules, events, todayStr)
          : '일정 확인 불가',
      )
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '출석 데이터를 불러오지 못했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    if (canManageAttendance) {
      void loadManagedAttendance(todayStr)
      return
    }
    void loadMemberAttendance()
  }, [canManageAttendance, loadManagedAttendance, loadMemberAttendance, todayStr])

  const handleDateFilter = () => {
    if (!dateInput) return
    void loadManagedAttendance(dateInput)
  }

  const handleFilterChange = (nextFilter: AttendanceFilter) => {
    setFilter(nextFilter)
    if (nextFilter === 'today') {
      void loadManagedAttendance(todayStr)
    } else if (nextFilter === 'week') {
      const week = getWeekRange(todayStr)
      void loadManagedAttendance(week.start, week.end)
    }
  }

  const handleMemberClockClick = async () => {
    await workSession.handleClockClick()
    await loadMemberAttendance()
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
      formatDateRangeToken(activeRange.start, activeRange.end),
    )
  }

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <div>
          <p className="page-eyebrow">ATTENDANCE · {activeDate}</p>
          <h1>{canManageAttendance ? '출석 관리' : '오늘 출석'}</h1>
          <p className="page-description">
            {canManageAttendance ? (
              <>오늘의 출석 현황과 확인이 필요한 기록을 <span className="attendance-phrase">한 곳</span>에서 관리합니다.</>
            ) : '오늘 예정된 근무 시간과 출퇴근 상태를 확인하세요.'}
          </p>
        </div>
        <div className="header-actions">
          {canManageAttendance && (
            <button type="button" className="attendance-export-button" onClick={handleExport}>
              <Download size={18} />
              CSV 내보내기
            </button>
          )}
          <time className="attendance-date-badge" dateTime={activeRange.start}>{activeDate}</time>
          {canManageAttendance && (
            <div className="attendance-filter-group" role="group" aria-label="출석 날짜 필터">
              <button type="button" className={filter === 'today' ? 'active' : ''} aria-pressed={filter === 'today'} onClick={() => handleFilterChange('today')}>
                오늘
              </button>
              <button type="button" className={filter === 'week' ? 'active' : ''} aria-pressed={filter === 'week'} onClick={() => handleFilterChange('week')}>
                이번 주
              </button>
              <button type="button" className={filter === 'custom' ? 'active' : ''} aria-pressed={filter === 'custom'} onClick={() => handleFilterChange('custom')}>
                날짜 선택
              </button>
            </div>
          )}
          {canManageAttendance && filter === 'custom' && (
            <div className="custom-date-filter">
              <label htmlFor="attendance-date">조회 날짜</label>
              <input
                id="attendance-date"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="date-input"
              />
              <button type="button" className="filter-apply-btn" onClick={handleDateFilter}>조회</button>
            </div>
          )}
        </div>
      </header>

      <div className="attendance-content">
        {canManageAttendance ? (
          <OperatorAttendanceBoard
            records={records}
            todayStr={activeDate}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={() => void loadManagedAttendance(activeRange.start, activeRange.end)}
            memberSchedules={managedSchedules}
            scheduleEvents={managedScheduleEvents}
          />
        ) : (
          <>
            <MemberAttendanceView
              records={myRecords}
              todayStr={todayStr}
              sessionStatus={workSession.status}
              isLoading={workSession.isLoading}
              handleClockClick={handleMemberClockClick}
              errorMessage={errorMessage ?? workSession.errorMessage}
              onRetry={() => {
                workSession.clearError()
                void loadMemberAttendance()
              }}
              scheduleLabel={memberScheduleLabel}
            />
            <section className="member-schedule-section" aria-labelledby="member-schedule-title">
              <div className="section-heading-row">
                <div>
                  <p className="section-eyebrow">PERSONAL SETTINGS</p>
                  <h2 id="member-schedule-title">내 근무 설정</h2>
                </div>
              </div>
              <SetWorkDaysPersonal />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
