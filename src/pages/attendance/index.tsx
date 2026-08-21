import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { useWorkSession } from '../../features/attendance/model/useWorkSession'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import { getAttendanceByDate, getMyAttendance } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import { getTodayStr } from '../../shared/lib/date'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { MemberAttendanceView } from './components/MemberAttendanceView'
import { OperatorAttendanceBoard } from './components/OperatorAttendanceBoard'
import './attendance.css'

type AttendanceFilter = 'today' | 'week' | 'custom'

export function Attendance() {
  const { isAdmin } = useApp()
  const workSession = useWorkSession()
  const [filter, setFilter] = useState<AttendanceFilter>('today')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([])
  const [dateInput, setDateInput] = useState('')
  const [activeDate, setActiveDate] = useState(getTodayStr())
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const todayStr = getTodayStr()
  const loadAttendance = useCallback(async (date = todayStr) => {
    setIsLoading(true)
    setErrorMessage(null)
    setActiveDate(date)

    try {
      if (isAdmin) {
        const nextRecords = await getAttendanceByDate(date)
        setRecords(nextRecords)
      } else {
        const nextMyRecords = await getMyAttendance()
        setMyRecords(nextMyRecords)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '출석 데이터를 불러오지 못했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, todayStr])

  useEffect(() => {
    void loadAttendance()
  }, [loadAttendance])

  const handleDateFilter = () => {
    if (!dateInput) return
    void loadAttendance(dateInput)
  }

  const handleFilterChange = (nextFilter: AttendanceFilter) => {
    setFilter(nextFilter)
    if (nextFilter !== 'custom') void loadAttendance(todayStr)
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
      activeDate,
    )
  }

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <div>
          <p className="page-eyebrow">ATTENDANCE · {activeDate}</p>
          <h1>{isAdmin ? '출석 관리' : '오늘 출석'}</h1>
          <p className="page-description">
            {isAdmin ? '오늘의 출석 현황과 확인이 필요한 기록을 한 곳에서 관리합니다.' : '오늘 예정된 근무 시간과 출퇴근 상태를 확인하세요.'}
          </p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button type="button" className="attendance-export-button" onClick={handleExport}>
              <Download size={18} />
              CSV 내보내기
            </button>
          )}
          <time className="attendance-date-badge" dateTime={activeDate}>{activeDate}</time>
          {isAdmin && (
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
          {isAdmin && filter === 'custom' && (
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
        {isAdmin ? (
          <OperatorAttendanceBoard
            records={records}
            todayStr={activeDate}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={() => void loadAttendance(activeDate)}
          />
        ) : (
          <>
            <MemberAttendanceView
              records={myRecords}
              todayStr={todayStr}
              sessionStatus={workSession.status}
              handleClockClick={workSession.handleClockClick}
              errorMessage={errorMessage ?? workSession.errorMessage}
              onRetry={() => {
                workSession.clearError()
                void loadAttendance()
              }}
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
