import { useMemo, useState } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import { useWorkSchedule } from '../model/useWorkSchedule'
import type { WeekPattern } from '../model/useWorkSchedule'
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

interface MonthPreviewCell {
  isoDate: string
  dayIndex: number
  isCurrentMonth: boolean
  occurrencePattern: Exclude<WeekPattern, 'EVERY' | 'LAST'>
  isLastOccurrence: boolean
  dayNumber: number
}

function toMondayIndex(jsDay: number) {
  return (jsDay + 6) % 7
}

function getOccurrencePattern(date: Date): Exclude<WeekPattern, 'EVERY' | 'LAST'> {
  const occurrence = Math.floor((date.getDate() - 1) / 7) + 1

  if (occurrence === 1) return 'FIRST'
  if (occurrence === 2) return 'SECOND'
  if (occurrence === 3) return 'THIRD'
  return 'FOURTH'
}

function isLastOccurrence(date: Date) {
  const nextWeek = new Date(date)
  nextWeek.setDate(date.getDate() + 7)
  return nextWeek.getMonth() !== date.getMonth()
}

function buildMonthPreview(referenceDate = new Date()): MonthPreviewCell[] {
  const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const startOffset = toMondayIndex(firstDay.getDay())
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + index)

    return {
      isoDate: current.toISOString().slice(0, 10),
      dayIndex: toMondayIndex(current.getDay()),
      isCurrentMonth: current.getMonth() === referenceDate.getMonth(),
      occurrencePattern: getOccurrencePattern(current),
      isLastOccurrence: isLastOccurrence(current),
      dayNumber: current.getDate(),
    }
  })
}

function isCellScheduled(
  isActiveDay: boolean,
  selectedPattern: WeekPattern,
  cell: MonthPreviewCell,
) {
  if (!isActiveDay) return false
  if (selectedPattern === 'EVERY') return true
  if (selectedPattern === 'LAST') return cell.isLastOccurrence
  return selectedPattern === cell.occurrencePattern
}

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

  const monthPreview = useMemo(() => buildMonthPreview(), [])
  const selectedDayName = DAY_NAMES[selectedDayIndex]
  const monthLabel = useMemo(() => {
    const today = new Date()
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 반복 미리보기`
  }, [])

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
        <p>이번 달 캘린더에서 반복 근무 패턴을 미리 확인하면서 요일별 근무 시간을 저장할 수 있습니다.</p>
      </div>

      {isLoading ? (
        <div className="schedule-loading">로딩 중...</div>
      ) : (
        <div className="schedule-calendar-layout">
          <div className="schedule-calendar-board">
            <div className="schedule-calendar-head">
              <strong>{monthLabel}</strong>
              <span>반복 패턴이 실제 달력에서 어떻게 보이는지 미리 확인할 수 있습니다.</span>
            </div>
            <div className="schedule-calendar-grid schedule-calendar-weekdays">
              {DAY_NAMES.map((day) => (
                <span key={day} className="schedule-calendar-weekday">{day}</span>
              ))}
            </div>
            <div className="schedule-calendar-grid schedule-calendar-days">
              {monthPreview.map((cell) => {
                const isActiveCell = isCellScheduled(workDays[cell.dayIndex], weekPatterns[cell.dayIndex], cell)
                const isSelectedDay = selectedDayIndex === cell.dayIndex

                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    className={[
                      'schedule-calendar-cell',
                      cell.isCurrentMonth ? 'current' : 'outside',
                      isActiveCell ? 'active' : 'inactive',
                      isSelectedDay ? 'selected' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedDayIndex(cell.dayIndex)}
                    aria-label={`${cell.dayNumber}일 ${DAY_NAMES[cell.dayIndex]} ${isActiveCell ? '근무 예정' : '휴무'}`}
                  >
                    <span className="schedule-calendar-date">{cell.dayNumber}</span>
                    <span className="schedule-calendar-state">
                      {isActiveCell
                        ? `${daySchedules[cell.dayIndex].checkInTime} - ${daySchedules[cell.dayIndex].checkOutTime}`
                        : '휴무'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

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
