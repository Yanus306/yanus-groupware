import { useState } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import { useWorkSchedule } from '../model/useWorkSchedule'
import type { WeekPattern } from '../model/useWorkSchedule'
import { formatScheduleRangeLabel } from '../../../shared/lib/attendanceSchedule'
import './SetWorkDaysPersonal.css'

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
const WEEK_PATTERN_OPTIONS: { value: WeekPattern; label: string }[] = [
  { value: 'EVERY', label: '매주' },
  { value: 'FIRST', label: '1주차' },
  { value: 'SECOND', label: '2주차' },
  { value: 'THIRD', label: '3주차' },
  { value: 'FOURTH', label: '4주차' },
  { value: 'LAST', label: '마지막 주' },
]

interface SetWorkDaysPersonalProps {
  onSaved?: () => void | Promise<void>
  hideHeader?: boolean
}

export function SetWorkDaysPersonal({ onSaved, hideHeader = false }: SetWorkDaysPersonalProps) {
  const { state } = useApp()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const {
    workDays,
    daySchedules,
    weekPatterns,
    isLoading,
    isSaving,
    error,
    toggleDay,
    setDayTime,
    setDayEndsNextDay,
    setWeekPattern,
    saveSchedule,
  } =
    useWorkSchedule()

  const handleSave = async () => {
    const saved = await saveSchedule()
    if (saved) {
      await onSaved?.()
    }
  }

  const selectedDayName = DAY_NAMES[selectedDayIndex]
  const selectedSchedule = daySchedules[selectedDayIndex]
  const selectedRangeLabel = formatScheduleRangeLabel({
    startTime: selectedSchedule?.checkInTime ?? null,
    endTime: selectedSchedule?.checkOutTime ?? null,
    endsNextDay: selectedSchedule?.endsNextDay,
  })

  return (
    <div className="set-work-days-personal">
      {!hideHeader && (
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
      )}

      <div className="schedule-summary">
        <span className="summary-chip">활성 요일 {workDays.filter(Boolean).length}일</span>
        <p>반복 근무는 여기서 요일별로 정리하고, 특정 날짜 예외 일정은 우측 캘린더에서 바로 추가할 수 있습니다.</p>
      </div>

      {isLoading ? (
        <div className="schedule-loading">로딩 중...</div>
      ) : (
        <div className="schedule-calendar-layout">
          <div className={`schedule-day-editor ${workDays[selectedDayIndex] ? 'active' : 'inactive'}`}>
            <div className="schedule-day-tabs" role="tablist" aria-label="근무 일정 요일 선택">
              {DAY_NAMES.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={selectedDayIndex === index}
                  className={`schedule-day-tab ${selectedDayIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedDayIndex(index)}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="day-card-head">
              <div>
                <span className="day-label">{selectedDayName}</span>
                <span className={`day-status ${workDays[selectedDayIndex] ? 'active' : 'inactive'}`}>
                  {workDays[selectedDayIndex] ? '근무일' : '휴무'}
                </span>
              </div>
              <button
                type="button"
                className={`toggle ${workDays[selectedDayIndex] ? 'on' : ''}`}
                onClick={() => toggleDay(selectedDayIndex)}
                aria-label={`${selectedDayName} 토글`}
              />
            </div>

            {workDays[selectedDayIndex] ? (
              <>
                <div className="day-times">
                  <div className="time-field">
                    <label>출근</label>
                    <input
                      type="time"
                      value={daySchedules[selectedDayIndex].checkInTime}
                      onChange={(e) => setDayTime(selectedDayIndex, 'checkInTime', e.target.value)}
                    />
                  </div>
                  <div className="time-field">
                    <label>퇴근</label>
                    <input
                      type="time"
                      value={daySchedules[selectedDayIndex].checkOutTime}
                      onChange={(e) => setDayTime(selectedDayIndex, 'checkOutTime', e.target.value)}
                    />
                  </div>
                </div>

                <label className="overnight-toggle-row">
                  <span className="overnight-toggle-copy">
                    <strong>다음날 종료</strong>
                    <small>{selectedRangeLabel} 일정으로 저장됩니다.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={daySchedules[selectedDayIndex].endsNextDay}
                    onChange={(event) => setDayEndsNextDay(selectedDayIndex, event.target.checked)}
                    aria-label={`${selectedDayName} 다음날 종료`}
                  />
                </label>

                <div className="week-pattern-group">
                  <span className="week-pattern-label">반복 주차</span>
                  <div className="week-pattern-options">
                    {WEEK_PATTERN_OPTIONS.map((option) => (
                      <button
                        key={`${selectedDayName}-${option.value}`}
                        type="button"
                        className={`week-pattern-chip ${weekPatterns[selectedDayIndex] === option.value ? 'active' : ''}`}
                        onClick={() => setWeekPattern(selectedDayIndex, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="day-off-label">
                <strong>{selectedDayName}요일은 비활성 상태입니다.</strong>
                <span>토글을 켜면 시간과 주차 패턴을 함께 설정할 수 있습니다.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="schedule-error">{error}</p>}

      <button className="schedule-save-btn" onClick={handleSave} disabled={isSaving}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
