import { Check, Circle, Clock3, RotateCw } from 'lucide-react'
import type { AttendanceRecord } from '../../../shared/api/attendanceApi'
import {
  getMemberAttendanceStatus,
  getStatusDescription,
  getStatusLabel,
  getTimeLabel,
  type WorkSessionStatus,
} from '../attendanceView'
import './member-attendance.css'

interface MemberAttendanceViewProps {
  records: AttendanceRecord[]
  todayStr: string
  sessionStatus: WorkSessionStatus
  isLoading: boolean
  handleClockClick: () => Promise<void> | void
  errorMessage: string | null
  onRetry: () => void
}

const timelineSteps = [
  { key: 'before', label: '출근 전', description: '출근 기록 전' },
  { key: 'working', label: '근무 중', description: '근무 기록 진행 중' },
  { key: 'done', label: '퇴근 완료', description: '오늘 기록 완료' },
  { key: 'exception', label: '예외 확인 필요', description: '운영 확인 필요' },
] as const

function getActionLabel(status: WorkSessionStatus): string {
  if (status === 'idle') return '출근하기'
  if (status === 'working') return '퇴근하기'
  return '오늘 출석 완료'
}

function isStepCurrent(stepKey: string, status: string): boolean {
  return stepKey === status
}

export function MemberAttendanceView({
  records,
  todayStr,
  sessionStatus,
  isLoading,
  handleClockClick,
  errorMessage,
  onRetry,
}: MemberAttendanceViewProps) {
  const todayRecord = records.find((record) => record.workDate === todayStr)
  const attendanceStatus = getMemberAttendanceStatus(todayRecord, sessionStatus)
  const actionLabel = getActionLabel(sessionStatus)

  return (
    <div className="member-attendance-view">
      <section className={`member-today-card status-${attendanceStatus}`} aria-labelledby="member-today-title">
        <div className="member-today-heading">
          <div>
            <p className="section-eyebrow">TODAY · {todayStr}</p>
            <h2 id="member-today-title">오늘 상태</h2>
          </div>
          <div className="schedule-chip" aria-label="오늘 예정 근무 시간">
            <Clock3 size={16} aria-hidden="true" />
            <span>09:00–18:00</span>
          </div>
        </div>

        <div className="member-status-copy">
          <div className="status-icon" aria-hidden="true">
            {attendanceStatus === 'done' ? <Check size={22} /> : <Circle size={18} />}
          </div>
          <div>
            <p className="status-label">{getStatusLabel(attendanceStatus)}</p>
            <p className="status-description">{getStatusDescription(attendanceStatus)}</p>
          </div>
        </div>

        <button
          type="button"
          className="member-clock-cta"
          onClick={() => void handleClockClick()}
          disabled={isLoading || sessionStatus === 'done'}
        >
          <RotateCw size={18} aria-hidden="true" />
          {actionLabel}
        </button>
      </section>

      <section className="member-timeline-section" aria-labelledby="member-timeline-title">
        <div className="section-heading-row">
          <div>
            <p className="section-eyebrow">STATUS</p>
            <h2 id="member-timeline-title">오늘의 출석 흐름</h2>
          </div>
          <span className="timeline-date">{todayStr}</span>
        </div>
        <ol className="attendance-timeline">
          {timelineSteps.map((step) => (
            <li
              key={step.key}
              className={isStepCurrent(step.key, attendanceStatus) ? 'current' : ''}
              aria-current={isStepCurrent(step.key, attendanceStatus) ? 'step' : undefined}
            >
              <span className="timeline-marker" aria-hidden="true" />
              <span>
                <strong>{step.label}</strong>
                <small>{step.description}</small>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="member-history-section" aria-labelledby="member-history-title">
        <div className="section-heading-row">
          <div>
            <p className="section-eyebrow">PERSONAL RECORDS</p>
            <h2 id="member-history-title">내 출퇴근 이력</h2>
          </div>
          <span className="section-count">{records.length}건</span>
        </div>
        {records.length === 0 ? (
          <div className="member-empty-state">아직 출퇴근 기록이 없습니다.</div>
        ) : (
          <div className="member-history-list" role="list">
            {records.map((record) => (
              <div className="member-history-row" key={record.id} role="listitem">
                <div>
                  <strong>{record.workDate}</strong>
                  <span>{record.status === 'LEFT' ? '퇴근 완료' : '근무 중'}</span>
                </div>
                <div className="history-times">
                  <span><small>출근</small>{getTimeLabel(record.checkInTime)}</span>
                  <span><small>퇴근</small>{getTimeLabel(record.checkOutTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {errorMessage && (
        <div className="member-error-state" role="alert">
          <strong>{errorMessage}</strong>
          <button type="button" onClick={onRetry}>다시 시도</button>
        </div>
      )}
    </div>
  )
}
