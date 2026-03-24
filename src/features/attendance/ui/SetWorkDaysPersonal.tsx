import { useApp } from '../../auth/model/AppProvider'
import { useWorkSchedule } from '../model/useWorkSchedule'
import type { WeekPattern } from '../model/useWorkSchedule'
import './SetWorkDaysPersonal.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEK_PATTERN_OPTIONS: { value: WeekPattern; label: string }[] = [
  { value: 'EVERY', label: '매주' },
  { value: 'FIRST', label: '1주차' },
  { value: 'SECOND', label: '2주차' },
  { value: 'THIRD', label: '3주차' },
  { value: 'FOURTH', label: '4주차' },
  { value: 'LAST', label: '마지막 주' },
]

export function SetWorkDaysPersonal() {
  const { state } = useApp()
  const {
    workDays,
    daySchedules,
    weekPatterns,
    isLoading,
    isSaving,
    error,
    toggleDay,
    setDayTime,
    setWeekPattern,
    saveSchedule,
  } =
    useWorkSchedule()

  return (
    <div className="set-work-days-personal">
      <div className="schedule-header">
        <div>
          <h3>근무 일정 설정</h3>
          <p className="desc">요일별 시간과 반복 주차를 함께 정리해 개인 근무 루틴을 관리할 수 있습니다.</p>
        </div>
        <div className="member-info">
          <span className="member-avatar">{state.currentUser?.name[0] ?? '?'}</span>
          <span className="member-name">{state.currentUser?.name ?? ''}</span>
        </div>
      </div>

      <div className="schedule-summary">
        <span className="summary-chip">활성 요일 {workDays.filter(Boolean).length}일</span>
        <p>주차 선택은 현재 브라우저에 함께 저장되며, 요일과 시간은 기존처럼 서버 저장을 유지합니다.</p>
      </div>

      {isLoading ? (
        <div className="schedule-loading">로딩 중...</div>
      ) : (
        <div className="day-schedule-grid">
          {DAY_NAMES.map((day, i) => (
            <div key={day} className={`day-col ${workDays[i] ? 'active' : 'inactive'}`}>
              <div className="day-card-head">
                <div>
                  <span className="day-label">{day}</span>
                  <span className={`day-status ${workDays[i] ? 'active' : 'inactive'}`}>
                    {workDays[i] ? '근무일' : '휴무'}
                  </span>
                </div>
                <button
                  type="button"
                  className={`toggle ${workDays[i] ? 'on' : ''}`}
                  onClick={() => toggleDay(i)}
                  aria-label={`${day} 토글`}
                />
              </div>

              {workDays[i] ? (
                <>
                  <div className="day-times">
                    <div className="time-field">
                      <label>출근</label>
                      <input
                        type="time"
                        value={daySchedules[i].checkInTime}
                        onChange={(e) => setDayTime(i, 'checkInTime', e.target.value)}
                      />
                    </div>
                    <div className="time-field">
                      <label>퇴근</label>
                      <input
                        type="time"
                        value={daySchedules[i].checkOutTime}
                        onChange={(e) => setDayTime(i, 'checkOutTime', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="week-pattern-group">
                    <span className="week-pattern-label">반복 주차</span>
                    <div className="week-pattern-options">
                      {WEEK_PATTERN_OPTIONS.map((option) => (
                        <button
                          key={`${day}-${option.value}`}
                          type="button"
                          className={`week-pattern-chip ${weekPatterns[i] === option.value ? 'active' : ''}`}
                          onClick={() => setWeekPattern(i, option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="day-off-label">
                  <strong>이번 요일은 비활성 상태입니다.</strong>
                  <span>토글을 켜면 시간과 주차 패턴을 함께 설정할 수 있습니다.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="schedule-error">{error}</p>}

      <button className="schedule-save-btn" onClick={saveSchedule} disabled={isSaving}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
