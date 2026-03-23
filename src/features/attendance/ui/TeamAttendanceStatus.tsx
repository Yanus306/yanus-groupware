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

export function TeamAttendanceStatus({ members, records, date }: Props) {
  const workingCount = records.filter((r) => r.status === 'WORKING').length
  const leftCount = records.filter((r) => r.status === 'LEFT').length
  const absentCount = members.length - workingCount - leftCount

  return (
    <div className="team-attendance-status">
      <div className="team-attend-header">
        <h3>팀원 출근 현황</h3>
        <span className="attend-date">{date}</span>
      </div>

      <div className="attend-summary">
        <div className="summary-item working">
          <span className="summary-count">{workingCount}</span>
          <span className="summary-label">근무 중</span>
        </div>
        <div className="summary-item left">
          <span className="summary-count">{leftCount}</span>
          <span className="summary-label">퇴근</span>
        </div>
        <div className="summary-item absent">
          <span className="summary-count">{absentCount}</span>
          <span className="summary-label">미출근</span>
        </div>
      </div>

      <div className="attend-member-grid">
        {members.map((member) => {
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
                    {rec.checkOutTime ? ` ~ ${formatTime(rec.checkOutTime)}` : '~'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
