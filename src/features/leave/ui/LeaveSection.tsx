import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useApp } from '../../auth/model/AppProvider'
import {
  getMyLeaves,
  createLeave,
  getAdminLeaves,
  approveLeave,
  rejectLeave,
} from '../../../shared/api/leavesApi'
import type { CreateLeavePayload } from '../../../shared/api/leavesApi'
import type { Leave } from '../../../entities/leave/model/types'
import { LEAVE_CATEGORY_LABELS, LEAVE_STATUS_LABELS } from '../../../entities/leave/model/types'
import type { LeaveCategory } from '../../../entities/leave/model/types'
import { Toast } from '../../../shared/ui/Toast'
import './LeaveSection.css'

const CATEGORIES: { value: LeaveCategory; label: string }[] = [
  { value: 'VACATION', label: '연차' },
  { value: 'SICK_LEAVE', label: '병가' },
  { value: 'PERSONAL', label: '개인' },
  { value: 'OTHER', label: '기타' },
]

export function LeaveSection() {
  const { state, isAdmin } = useApp()
  const [myLeaves, setMyLeaves] = useState<Leave[]>([])
  const [adminLeaves, setAdminLeaves] = useState<Leave[]>([])
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<LeaveCategory>('VACATION')
  const [detail, setDetail] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadMyLeaves = useCallback(() => {
    getMyLeaves()
      .then(setMyLeaves)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : '휴가 목록을 불러오지 못했습니다'))
  }, [])

  const loadAdminLeaves = useCallback(() => {
    if (!isAdmin || !state.currentUser) return
    // teamId는 현재 유저의 팀 기반 — 임시로 1번 팀
    getAdminLeaves(1)
      .then(setAdminLeaves)
      .catch(() => {})
  }, [isAdmin, state.currentUser])

  useEffect(() => {
    loadMyLeaves()
    loadAdminLeaves()
  }, [loadMyLeaves, loadAdminLeaves])

  const handleSubmit = async () => {
    if (!date) {
      setErrorMessage('날짜를 선택해주세요')
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateLeavePayload = { category, detail, date }
      const newLeave = await createLeave(payload)
      setMyLeaves((prev) => [newLeave, ...prev])
      setShowForm(false)
      setDetail('')
      setDate('')
      setCategory('VACATION')
      setSuccessMessage('휴가 신청이 완료되었습니다')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '휴가 신청에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      const updated = await approveLeave(id)
      setAdminLeaves((prev) => prev.map((l) => l.id === id ? updated : l))
      setSuccessMessage('승인되었습니다')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '승인에 실패했습니다')
    }
  }

  const handleReject = async (id: number) => {
    try {
      const updated = await rejectLeave(id)
      setAdminLeaves((prev) => prev.map((l) => l.id === id ? updated : l))
      setSuccessMessage('반려되었습니다')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '반려에 실패했습니다')
    }
  }

  return (
    <div className="leave-section">
      {errorMessage && <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />}
      {successMessage && <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}

      <div className="leave-header">
        <h3>휴가 신청</h3>
        <button className="leave-add-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? '취소' : '신청'}
        </button>
      </div>

      {showForm && (
        <div className="leave-form">
          <div className="leave-form-row">
            <label>종류</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as LeaveCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="leave-form-row">
            <label>날짜</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="leave-form-row">
            <label>사유</label>
            <input
              type="text"
              placeholder="사유를 입력하세요"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>
          <button className="leave-submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '신청 중...' : '신청하기'}
          </button>
        </div>
      )}

      <div className="leave-list">
        <h4>내 신청 내역</h4>
        {myLeaves.length === 0 ? (
          <p className="leave-empty">신청 내역이 없습니다</p>
        ) : (
          <table className="leave-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>종류</th>
                <th>사유</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.date}</td>
                  <td>{LEAVE_CATEGORY_LABELS[leave.category]}</td>
                  <td>{leave.detail || '-'}</td>
                  <td>
                    <span className={`leave-status-badge ${leave.status.toLowerCase()}`}>
                      {LEAVE_STATUS_LABELS[leave.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAdmin && (
        <div className="leave-admin-list">
          <h4>팀 휴가 신청 내역</h4>
          {adminLeaves.length === 0 ? (
            <p className="leave-empty">신청 내역이 없습니다</p>
          ) : (
            <table className="leave-table">
              <thead>
                <tr>
                  <th>신청자</th>
                  <th>날짜</th>
                  <th>종류</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {adminLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.memberName}</td>
                    <td>{leave.date}</td>
                    <td>{LEAVE_CATEGORY_LABELS[leave.category]}</td>
                    <td>{leave.detail || '-'}</td>
                    <td>
                      <span className={`leave-status-badge ${leave.status.toLowerCase()}`}>
                        {LEAVE_STATUS_LABELS[leave.status]}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'PENDING' && (
                        <div className="leave-actions">
                          <button className="leave-approve-btn" onClick={() => handleApprove(leave.id)}>
                            승인
                          </button>
                          <button className="leave-reject-btn" onClick={() => handleReject(leave.id)}>
                            반려
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
