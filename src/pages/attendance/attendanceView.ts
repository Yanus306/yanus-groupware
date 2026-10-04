import type { AttendanceRecord } from '../../shared/api/attendanceApi'

export type WorkSessionStatus = 'idle' | 'working' | 'done'
export type MemberAttendanceStatus = 'before' | 'working' | 'done' | 'exception'

export interface AttendanceSummary {
  total: number
  completed: number
  working: number
  needsReview: number
}

export function getMemberAttendanceStatus(
  record: AttendanceRecord | undefined,
  sessionStatus: WorkSessionStatus,
): MemberAttendanceStatus {
  if (sessionStatus === 'working') return 'working'
  if (sessionStatus === 'done') return 'done'
  if (!record) return 'before'
  return record.status === 'LEFT' ? 'done' : 'working'
}

export function getStatusLabel(status: MemberAttendanceStatus): string {
  const labels: Record<MemberAttendanceStatus, string> = {
    before: '출근 전',
    working: '근무 중',
    done: '퇴근 완료',
    exception: '예외 확인 필요',
  }
  return labels[status]
}

export function getStatusDescription(status: MemberAttendanceStatus): string {
  const descriptions: Record<MemberAttendanceStatus, string> = {
    before: '오늘 근무를 시작하면 출근 기록이 남습니다.',
    working: '현재 근무 중입니다. 퇴근할 때 기록을 완료하세요.',
    done: '오늘 출퇴근 기록이 완료되었습니다.',
    exception: '기록을 확인하고 운영 담당자에게 문의해 주세요.',
  }
  return descriptions[status]
}

export function getTimeLabel(value: string | null): string {
  if (!value) return '미기록'
  return value.includes('T') ? value.slice(11, 16) : value.slice(0, 5)
}

export function getAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
  const completed = records.filter((record) => record.status === 'LEFT').length
  const working = records.filter((record) => record.status === 'WORKING').length

  return {
    total: records.length,
    completed,
    working,
    needsReview: working,
  }
}
