import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCheck, ClipboardList, MessageSquareText } from 'lucide-react'
import type {
  AttendanceException,
  AttendanceExceptionStatus,
  AttendanceExceptionSummary,
  AttendanceExceptionType,
} from '../../../shared/api/attendanceExceptionsApi'
import { formatDateTimeClock, formatScheduleRangeLabel } from '../../../shared/lib/attendanceSchedule'
import { formatTeamName } from '../../../shared/lib/team'
import { DataTableScroll } from '../../../shared/ui/DataTableSection'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { SectionHeader } from '../../../shared/ui/SectionHeader'
import './AttendanceExceptionBoard.css'

type AttendanceExceptionTypeFilter = AttendanceExceptionType | 'ALL'
type AttendanceExceptionStatusFilter = AttendanceExceptionStatus | 'ALL'

interface AttendanceExceptionBoardProps {
  date: string
  summary: AttendanceExceptionSummary | null
  items: AttendanceException[]
  loading: boolean
  teamOptions: string[]
  selectedType: AttendanceExceptionTypeFilter
  selectedStatus: AttendanceExceptionStatusFilter
  selectedTeamName: string
  actionLoading: boolean
  bulkLoading: boolean
  onTypeChange: (nextType: AttendanceExceptionTypeFilter) => void
  onStatusChange: (nextStatus: AttendanceExceptionStatusFilter) => void
  onTeamChange: (nextTeamName: string) => void
  onSaveNote: (exceptionId: number, note: string) => void
  onApprove: (exceptionId: number, note: string) => void
  onReject: (exceptionId: number, note: string) => void
  onResolve: (exceptionId: number, note: string) => void
  onBulkAutoCheckout: () => void
}

const typeLabels: Record<AttendanceExceptionType, string> = {
  MISSED_CHECK_IN: '미출근',
  MISSED_CHECK_OUT: '미퇴근',
  LATE: '지각',
  NO_SCHEDULE: '근무 일정 없음',
}

const statusLabels: Record<AttendanceExceptionStatus, string> = {
  OPEN: '처리 대기',
  APPROVED: '승인 완료',
  REJECTED: '반려됨',
  RESOLVED: '처리 완료',
}

const typeOptions: { value: AttendanceExceptionTypeFilter; label: string }[] = [
  { value: 'ALL', label: '전체 유형' },
  { value: 'MISSED_CHECK_IN', label: typeLabels.MISSED_CHECK_IN },
  { value: 'MISSED_CHECK_OUT', label: typeLabels.MISSED_CHECK_OUT },
  { value: 'LATE', label: typeLabels.LATE },
  { value: 'NO_SCHEDULE', label: typeLabels.NO_SCHEDULE },
]

const statusOptions: { value: AttendanceExceptionStatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'OPEN', label: statusLabels.OPEN },
  { value: 'APPROVED', label: statusLabels.APPROVED },
  { value: 'REJECTED', label: statusLabels.REJECTED },
  { value: 'RESOLVED', label: statusLabels.RESOLVED },
]

function describeException(exception: AttendanceException) {
  if (exception.type === 'MISSED_CHECK_OUT') {
    return '퇴근 기록이 누락된 상태입니다. 자동 체크아웃 또는 사유 확인이 필요합니다.'
  }

  if (exception.type === 'MISSED_CHECK_IN') {
    return '근무 일정은 있었지만 출근 기록이 남지 않았습니다.'
  }

  if (exception.type === 'LATE') {
    return '예정 출근 시간보다 늦게 체크인해 정산 검토가 필요한 상태입니다.'
  }

  return '근무 일정 없이 출근 기록이 있어 운영 메모와 정산 판단이 필요합니다.'
}

export function AttendanceExceptionBoard({
  date,
  summary,
  items,
  loading,
  teamOptions,
  selectedType,
  selectedStatus,
  selectedTeamName,
  actionLoading,
  bulkLoading,
  onTypeChange,
  onStatusChange,
  onTeamChange,
  onSaveNote,
  onApprove,
  onReject,
  onResolve,
  onBulkAutoCheckout,
}: AttendanceExceptionBoardProps) {
  const [selectedExceptionId, setSelectedExceptionId] = useState<number | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const selectedException = useMemo(
    () => items.find((item) => item.id === selectedExceptionId) ?? null,
    [items, selectedExceptionId],
  )

  useEffect(() => {
    if (items.length === 0) {
      setSelectedExceptionId(null)
      return
    }

    if (selectedExceptionId && items.some((item) => item.id === selectedExceptionId)) {
      return
    }

    setSelectedExceptionId(items[0].id)
  }, [items, selectedExceptionId])

  useEffect(() => {
    setNoteDraft(selectedException?.note ?? '')
  }, [selectedException])

  const openMissedCheckoutCount = items.filter(
    (item) => item.type === 'MISSED_CHECK_OUT' && item.status === 'OPEN',
  ).length

  return (
    <section className="attendance-exception-board">
      <SectionHeader
        eyebrow="Operations"
        title="출퇴근 예외 처리"
        description="총무와 팀장이 오늘 운영 이슈를 한 화면에서 보고, 메모와 처리 상태를 바로 남길 수 있습니다."
        actions={(
          <button
            type="button"
            className="attendance-exception-bulk-btn"
            onClick={onBulkAutoCheckout}
            disabled={bulkLoading || openMissedCheckoutCount === 0}
          >
            <CheckCheck size={16} />
            {bulkLoading ? '일괄 처리 중...' : `오늘 미퇴근자 일괄 처리${openMissedCheckoutCount > 0 ? ` (${openMissedCheckoutCount})` : ''}`}
          </button>
        )}
      />

      <div className="attendance-exception-summary-grid">
        <article className="attendance-exception-summary-card emphasis">
          <span>처리 대기</span>
          <strong>{summary?.openCount ?? 0}건</strong>
          <p>{date} 기준으로 아직 판단이 필요한 예외입니다.</p>
        </article>
        <article className="attendance-exception-summary-card">
          <span>미출근</span>
          <strong>{summary?.missedCheckInCount ?? 0}건</strong>
          <p>근무 일정은 있었지만 출근 기록이 없는 인원입니다.</p>
        </article>
        <article className="attendance-exception-summary-card">
          <span>미퇴근</span>
          <strong>{summary?.missedCheckOutCount ?? 0}건</strong>
          <p>출근 후 퇴근 기록이 누락된 인원입니다.</p>
        </article>
        <article className="attendance-exception-summary-card">
          <span>지각 / 무일정</span>
          <strong>{(summary?.lateCount ?? 0) + (summary?.noScheduleCount ?? 0)}건</strong>
          <p>정산과 운영 메모를 함께 확인해야 하는 예외입니다.</p>
        </article>
      </div>

      <div className="attendance-exception-toolbar">
        <label className="attendance-exception-field">
          <span>유형 필터</span>
          <select value={selectedType} onChange={(event) => onTypeChange(event.target.value as AttendanceExceptionTypeFilter)}>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="attendance-exception-field">
          <span>상태 필터</span>
          <select value={selectedStatus} onChange={(event) => onStatusChange(event.target.value as AttendanceExceptionStatusFilter)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="attendance-exception-field">
          <span>팀 필터</span>
          <select value={selectedTeamName} onChange={(event) => onTeamChange(event.target.value)}>
            <option value="">전체 팀</option>
            {teamOptions.map((teamName) => (
              <option key={teamName} value={teamName}>
                {formatTeamName(teamName)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <EmptyState
          compact
          title="출퇴근 예외를 정리하는 중입니다."
          description="오늘 운영 이슈를 유형별로 묶어 관리자 화면에 준비하고 있습니다."
        />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          title="현재 조건에 맞는 출퇴근 예외가 없습니다."
          description="필터를 바꾸거나, 오늘 기준 예외가 새로 발생하면 이곳에 표시됩니다."
        />
      ) : (
        <div className="attendance-exception-content">
          <DataTableScroll className="attendance-exception-table-wrap">
            <table className="attendance-exception-table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>멤버</th>
                  <th>팀</th>
                  <th>예정</th>
                  <th>실제</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {items.map((exception) => (
                  <tr
                    key={exception.id}
                    className={exception.id === selectedExceptionId ? 'selected' : ''}
                    onClick={() => setSelectedExceptionId(exception.id)}
                  >
                    <td>
                      <span className={`attendance-exception-pill ${exception.type}`}>
                        {typeLabels[exception.type]}
                      </span>
                    </td>
                    <td>{exception.memberName}</td>
                    <td>{formatTeamName(exception.teamName)}</td>
                    <td>
                      {formatScheduleRangeLabel({
                        startTime: exception.scheduledStartTime,
                        endTime: exception.scheduledEndTime,
                        endsNextDay: exception.endsNextDay,
                        scheduledStartAt: exception.scheduledStartAt,
                        scheduledEndAt: exception.scheduledEndAt,
                      })}
                    </td>
                    <td>
                      {formatDateTimeClock(exception.checkInTime)} - {formatDateTimeClock(exception.checkOutTime)}
                    </td>
                    <td>
                      <span className={`attendance-exception-status ${exception.status}`}>
                        {statusLabels[exception.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableScroll>

          {selectedException && (
            <article className="attendance-exception-detail">
              <div className="attendance-exception-detail-head">
                <div>
                  <span className="attendance-exception-detail-eyebrow">선택한 예외</span>
                  <h4>{selectedException.memberName} · {typeLabels[selectedException.type]}</h4>
                  <p>{describeException(selectedException)}</p>
                </div>
                <div className={`attendance-exception-status ${selectedException.status}`}>
                  {statusLabels[selectedException.status]}
                </div>
              </div>

              <div className="attendance-exception-detail-meta">
                <div className="attendance-exception-meta-card">
                  <ClipboardList size={16} />
                  <div>
                    <strong>기록 정보</strong>
                    <span>{selectedException.workDate} · {formatTeamName(selectedException.teamName)}</span>
                    <span>
                      예정 {
                        formatScheduleRangeLabel({
                          startTime: selectedException.scheduledStartTime,
                          endTime: selectedException.scheduledEndTime,
                          endsNextDay: selectedException.endsNextDay,
                          scheduledStartAt: selectedException.scheduledStartAt,
                          scheduledEndAt: selectedException.scheduledEndAt,
                        })
                      }
                    </span>
                    <span>실제 {formatDateTimeClock(selectedException.checkInTime)} - {formatDateTimeClock(selectedException.checkOutTime)}</span>
                  </div>
                </div>
                <div className="attendance-exception-meta-card">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>사유 / 처리 이력</strong>
                    <span>{selectedException.reason || '등록된 사유가 없습니다.'}</span>
                    <span>
                      승인 {selectedException.approvedBy ? `${selectedException.approvedBy} · ${selectedException.approvedAt?.slice(0, 16)?.replace('T', ' ')}` : '-'}
                    </span>
                    <span>
                      처리 {selectedException.resolvedBy ? `${selectedException.resolvedBy} · ${selectedException.resolvedAt?.slice(0, 16)?.replace('T', ' ')}` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <label className="attendance-exception-note-field">
                <span>
                  <MessageSquareText size={16} />
                  운영 메모
                </span>
                <textarea
                  aria-label="출퇴근 예외 메모 입력"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="예: 동아리 행사 후 퇴근 누락, 사유서 제출 예정"
                />
              </label>

              <div className="attendance-exception-actions">
                <button
                  type="button"
                  className="attendance-exception-secondary-btn"
                  onClick={() => onSaveNote(selectedException.id, noteDraft)}
                  disabled={actionLoading}
                >
                  {actionLoading ? '저장 중...' : '메모 저장'}
                </button>
                <button
                  type="button"
                  className="attendance-exception-secondary-btn approve"
                  onClick={() => onApprove(selectedException.id, noteDraft)}
                  disabled={actionLoading || selectedException.status === 'APPROVED'}
                >
                  승인
                </button>
                <button
                  type="button"
                  className="attendance-exception-secondary-btn reject"
                  onClick={() => onReject(selectedException.id, noteDraft)}
                  disabled={actionLoading || selectedException.status === 'REJECTED'}
                >
                  반려
                </button>
                <button
                  type="button"
                  className="attendance-exception-primary-btn"
                  onClick={() => onResolve(selectedException.id, noteDraft)}
                  disabled={actionLoading || selectedException.status === 'RESOLVED'}
                >
                  {actionLoading ? '처리 중...' : '처리 완료'}
                </button>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  )
}
