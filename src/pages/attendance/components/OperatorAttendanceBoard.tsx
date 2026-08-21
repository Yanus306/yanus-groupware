import { AlertCircle, CheckCircle2, Clock3, Search, X } from 'lucide-react'
import { useState } from 'react'
import type {
  AttendanceRecord,
  MemberWorkScheduleItem,
  WorkScheduleEventItem,
} from '../../../shared/api/attendanceApi'
import {
  getAttendanceSummary,
  getTimeLabel,
} from '../attendanceView'
import { formatWorkScheduleForDate } from '../../../shared/lib/attendanceSchedule'
import './operator-attendance.css'

type StatusFilter = 'all' | 'working' | 'left'

interface OperatorAttendanceBoardProps {
  records: AttendanceRecord[]
  todayStr: string
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
  memberSchedules: MemberWorkScheduleItem[]
  scheduleEvents: WorkScheduleEventItem[]
  scheduleErrorMessage?: string | null
}

function sortRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort((left, right) => {
    if (left.status !== right.status) return left.status === 'WORKING' ? -1 : 1
    return left.memberName.localeCompare(right.memberName, 'ko')
  })
}

function getRecordStatusLabel(status: AttendanceRecord['status']): string {
  return status === 'WORKING' ? '근무 중' : '퇴근 완료'
}

export function OperatorAttendanceBoard({
  records,
  todayStr,
  isLoading,
  errorMessage,
  onRetry,
  memberSchedules,
  scheduleEvents,
  scheduleErrorMessage = null,
}: OperatorAttendanceBoardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const summary = getAttendanceSummary(records)
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const visibleRecords = sortRecords(records).filter((record) => {
    const matchesSearch = record.memberName.toLocaleLowerCase().includes(normalizedSearch)
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'working' && record.status === 'WORKING') ||
      (statusFilter === 'left' && record.status === 'LEFT')
    return matchesSearch && matchesStatus
  })
  const visibleSelectedRecord = selectedRecord
    ? visibleRecords.find((record) => record.id === selectedRecord.id) ?? null
    : null
  const selectedMemberSchedule = visibleSelectedRecord
    ? memberSchedules.find((item) => item.memberId === visibleSelectedRecord.memberId)
    : undefined
  const selectedScheduleLabel = visibleSelectedRecord
    ? formatWorkScheduleForDate(
      selectedMemberSchedule?.workSchedules ?? [],
      scheduleEvents.filter((event) => event.memberId === visibleSelectedRecord.memberId),
      visibleSelectedRecord.workDate,
    )
    : '휴무'

  const hasSearchFilter = normalizedSearch.length > 0
  const hasStatusFilter = statusFilter !== 'all'

  return (
    <section className="operator-board" aria-labelledby="operator-board-title">
      <div className="operator-summary-grid" aria-label="오늘 출석 요약">
        <article className="operator-summary-card">
          <span>전체 기록</span>
          <strong>{summary.total}</strong>
          <small>{todayStr}</small>
        </article>
        <article className="operator-summary-card operator-summary-card-warning">
          <span>처리 필요</span>
          <strong>{summary.needsReview}</strong>
          <small>근무 중 기록</small>
        </article>
        <article className="operator-summary-card">
          <span>근무 중</span>
          <strong>{summary.working}</strong>
          <small>현재 진행 중</small>
        </article>
        <article className="operator-summary-card">
          <span>퇴근 완료</span>
          <strong>{summary.completed}</strong>
          <small>완료 기록</small>
        </article>
      </div>

      <div className="operator-priority-banner">
        <div>
          <p className="section-eyebrow">OPERATIONS FIRST</p>
          <h2 id="operator-board-title">처리 필요</h2>
        </div>
        <span>{summary.needsReview}건이 먼저 표시됩니다.</span>
      </div>

      <div className="operator-toolbar">
        <label className="operator-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">멤버 검색</span>
          <input
            type="search"
            aria-label="멤버 검색"
            placeholder="멤버 검색"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <div className="operator-filters" role="group" aria-label="출석 상태 필터">
          {([
            ['all', '전체'],
            ['working', '근무 중'],
            ['left', '퇴근 완료'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={statusFilter === value ? 'active' : ''}
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="operator-content-grid">
        <div className="operator-records-panel">
          <div className="operator-panel-heading">
            <div>
              <p className="section-eyebrow">TODAY RECORDS</p>
              <h3>오늘 기록</h3>
            </div>
            <span>{visibleRecords.length}명</span>
          </div>

          {isLoading ? (
            <div className="operator-state" role="status">출석 데이터를 불러오는 중입니다.</div>
          ) : errorMessage ? (
            <div className="operator-state operator-state-error" role="alert">
              <AlertCircle size={20} aria-hidden="true" />
              <strong>{errorMessage}</strong>
              <button type="button" onClick={onRetry}>다시 시도</button>
            </div>
          ) : scheduleErrorMessage ? (
            <div className="operator-state operator-state-error" role="alert">
              <AlertCircle size={20} aria-hidden="true" />
              <strong>{scheduleErrorMessage}</strong>
              <button type="button" onClick={onRetry}>다시 시도</button>
            </div>
          ) : visibleRecords.length === 0 ? (
            <div className="operator-state">
              <CheckCircle2 size={20} aria-hidden="true" />
              <strong>
                {hasSearchFilter
                  ? '검색 결과가 없습니다.'
                  : hasStatusFilter
                    ? '선택한 상태의 기록이 없습니다.'
                    : '처리할 출석 기록이 없습니다'}
              </strong>
              <span>
                {hasSearchFilter
                  ? '다른 멤버 이름으로 검색해 보세요.'
                  : hasStatusFilter
                    ? '다른 출석 상태를 선택해 보세요.'
                    : '선택한 날짜에 확인할 기록이 없습니다.'}
              </span>
            </div>
          ) : (
            <div className="operator-record-list" role="list">
              {visibleRecords.map((record) => (
                <button
                  type="button"
                  key={record.id}
                  className={`operator-record-row ${record.status === 'WORKING' ? 'needs-review' : ''}`}
                  aria-label={`${record.memberName} 기록 상세 보기`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <span className="operator-member-avatar" aria-hidden="true">{record.memberName[0]}</span>
                  <span className="operator-member-info">
                    <strong>{record.memberName}</strong>
                    <small>{record.workDate}</small>
                  </span>
                  <span className="operator-record-time">
                    <small>출근</small>
                    {getTimeLabel(record.checkInTime)}
                  </span>
                  <span className="operator-record-time">
                    <small>퇴근</small>
                    {getTimeLabel(record.checkOutTime)}
                  </span>
                  <span className={`operator-status status-${record.status.toLowerCase()}`}>
                    {record.status === 'WORKING' ? <Clock3 size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                    {getRecordStatusLabel(record.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {visibleSelectedRecord && (
          <aside className="operator-detail-panel" aria-labelledby="operator-detail-title">
            <div className="operator-detail-heading">
              <div>
                <p className="section-eyebrow">RECORD DETAIL</p>
                <h3 id="operator-detail-title">{visibleSelectedRecord.memberName} 상세</h3>
              </div>
              <button type="button" className="operator-detail-close" aria-label="상세 닫기" onClick={() => setSelectedRecord(null)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <dl className="operator-detail-list">
              <div><dt>날짜</dt><dd>{visibleSelectedRecord.workDate}</dd></div>
              <div><dt>상태</dt><dd>{getRecordStatusLabel(visibleSelectedRecord.status)}</dd></div>
              <div><dt>예정 시간</dt><dd>{selectedScheduleLabel}</dd></div>
              <div><dt>출근</dt><dd>{getTimeLabel(visibleSelectedRecord.checkInTime)}</dd></div>
              <div><dt>퇴근</dt><dd>{getTimeLabel(visibleSelectedRecord.checkOutTime)}</dd></div>
            </dl>
            <div className="operator-detail-note">
              <Clock3 size={16} aria-hidden="true" />
              <span>기록 확인 후 사유·승인·정산 연결 영역에서 후속 처리할 수 있습니다.</span>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
