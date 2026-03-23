import { useState } from 'react'
import type { User } from '../../../entities/user/model/types'
import type { AttendanceRecord } from '../../../shared/api/attendanceApi'
import './TeamAttendanceStatus.css'

interface Props {
  members: User[]
  records: AttendanceRecord[]
  date: string
}

type AttendStatus = 'working' | 'left' | 'absent'

function getStatus(memberId: string, records: AttendanceRecord[]): AttendStatus {
  const rec = records.find((r) => String(r.memberId) === memberId)
  if (!rec) return 'absent'
  return rec.status === 'WORKING' ? 'working' : 'left'
}

function formatTime(isoStr: string | null) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const STATUS_LABEL: Record<AttendStatus, string> = {
  working: '근무 중',
  left: '퇴근',
  absent: '미출근',
}

const TEAM_LABEL: Record<string, string> = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  AI: 'AI',
  SECURITY: 'Security',
}

const FILTER_TABS: { value: AttendStatus; label: string }[] = [
  { value: 'working', label: '근무 중' },
  { value: 'left', label: '퇴근' },
  { value: 'absent', label: '미출근' },
]

export function TeamAttendanceStatus({ members, records, date }: Props) {
  const [activeFilter, setActiveFilter] = useState<AttendStatus>('working')

  const workingCount = records.filter((r) => r.status === 'WORKING').length
  const leftCount = records.filter((r) => r.status === 'LEFT').length
  const absentCount = members.length - workingCount - leftCount

  const filteredMembers = members.filter(
    (member) => getStatus(member.id, records) === activeFilter,
  )

  return (
    <div className="team-attendance-status">
      <div className="team-attend-header">
        <h3>팀원 출근 현황</h3>
        <span className="attend-date">{date}</span>
      </div>

      <div className="attend-summary">
        {FILTER_TABS.map(({ value, label }) => {
          const count = value === 'working' ? workingCount : value === 'left' ? leftCount : absentCount
          return (
            <button
              key={value}
              className={`summary-item ${value} ${activeFilter === value ? 'active' : ''}`}
              onClick={() => setActiveFilter(value)}
            >
              <span className="summary-count">{count}</span>
              <span className="summary-label">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="attend-member-grid">
        {filteredMembers.length === 0 ? (
          <p className="attend-empty">해당 상태의 팀원이 없습니다</p>
        ) : (
          filteredMembers.map((member) => {
            const rec = records.find((r) => String(r.memberId) === member.id)
            const status = getStatus(member.id, records)
            return (
              <div key={member.id} className={`attend-member-card ${status}`}>
                <div className="attend-member-avatar">{member.name[0]}</div>
                <div className="attend-member-info">
                  <span className="attend-member-name">{member.name}</span>
                  <span className="attend-member-team">{TEAM_LABEL[member.team] ?? member.team}</span>
                </div>
                <div className="attend-member-right">
                  <span className={`attend-status-badge ${status}`}>
                    {STATUS_LABEL[status]}
                  </span>
                  {rec && (
                    <span className="attend-time">
                      {formatTime(rec.checkInTime)}
                      {rec.checkOutTime ? ` ~ ${formatTime(rec.checkOutTime)}` : ' ~'}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
