import { Download } from 'lucide-react'
import { useAttendancePage } from '../../features/attendance/model/useAttendancePage'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import { formatDateRangeToken } from '../../shared/lib/date'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import { MemberAttendanceView } from './components/MemberAttendanceView'
import { OperatorAttendanceBoard } from './components/OperatorAttendanceBoard'
import './attendance.css'

export function Attendance() {
  const {
    activeDate,
    activeRange,
    canManageAttendance,
    dateInput,
    errorMessage,
    filter,
    handleDateFilter,
    handleFilterChange,
    handleMemberClockClick,
    isLoading,
    managedScheduleEvents,
    managedSchedules,
    memberScheduleLabel,
    myRecords,
    records,
    retry,
    scheduleErrorMessage,
    setDateInput,
    todayStr,
    workSession,
  } = useAttendancePage()

  const managementDescription = filter === 'today'
    ? '오늘의 출석 현황과 확인이 필요한 기록을'
    : filter === 'week'
      ? '이번 주의 출석 현황과 확인이 필요한 기록을'
      : '선택한 날짜의 출석 현황과 확인이 필요한 기록을'

  const handleExport = () => {
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
              <>{managementDescription} <span className="attendance-phrase">한 곳</span>에서 관리합니다.</>
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
                onChange={(event) => setDateInput(event.target.value)}
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
            dateLabel={activeDate}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={retry}
            memberSchedules={managedSchedules}
            scheduleEvents={managedScheduleEvents}
            scheduleErrorMessage={scheduleErrorMessage}
          />
        ) : (
          <>
            <MemberAttendanceView
              records={myRecords}
              todayStr={todayStr}
              sessionStatus={workSession.status}
              isLoading={isLoading || workSession.isLoading}
              handleClockClick={handleMemberClockClick}
              errorMessage={errorMessage ?? scheduleErrorMessage ?? workSession.errorMessage}
              onRetry={retry}
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
