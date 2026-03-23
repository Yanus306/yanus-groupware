export type LeaveCategory = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'OTHER'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export const LEAVE_CATEGORY_LABELS: Record<LeaveCategory, string> = {
  VACATION: '연차',
  SICK_LEAVE: '병가',
  PERSONAL: '개인',
  OTHER: '기타',
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: '검토 중',
  APPROVED: '승인',
  REJECTED: '반려',
}

export interface Leave {
  id: number
  memberId: number
  memberName: string
  category: LeaveCategory
  detail: string
  date: string           // YYYY-MM-DD
  status: LeaveStatus
  submittedAt: string    // ISO datetime
  reviewedAt: string | null
}
