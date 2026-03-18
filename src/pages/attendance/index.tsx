import { useState, useEffect } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import { getAttendance } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import './attendance.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Attendance() {
  const { isAdmin } = useApp()
  const [filter, setFilter] = useState<'week' | 'month' | 'custom'>('month')
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    getAttendance()
      .then(setRecords)
      .catch(() => {})
  }, [])

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <h1>Attendance</h1>
        <div className="header-actions">
          <button className="export-btn glass">
            <Download size={18} />
            Export
          </button>
          <div className="date-range glass">2026.03.01 - 2026.03.31</div>
          <div className="filter-tabs">
            <button className={filter === 'week' ? 'active' : ''} onClick={() => setFilter('week')}>
              This Week
            </button>
            <button className={filter === 'month' ? 'active' : ''} onClick={() => setFilter('month')}>
              This Month
            </button>
            <button className={filter === 'custom' ? 'active' : ''} onClick={() => setFilter('custom')}>
              Custom
            </button>
          </div>
        </div>
      </header>

      <div className="attendance-content">
        <div className={`two-cards-row ${!isAdmin ? 'single' : ''}`}>
          <section className="set-work-days-section glass">
            <SetWorkDaysPersonal />
          </section>
          {isAdmin && (
            <section className="records-section glass">
              <h3>Attendance Records</h3>
              <div className="records-table-wrap">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Member ↕</th>
                      <th>Scheduled Days</th>
                      <th>Check-in Time</th>
                      <th>Check-out Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className={r.status === 'working' ? 'late' : ''}>
                        <td>
                          <span className="record-avatar">{r.userId[0]}</span>
                          User {r.userId}
                        </td>
                        <td>
                          {DAYS.map((_, i) => (
                            <span key={i} className={`dot ${i < 5 ? 'on' : ''}`} />
                          ))}
                        </td>
                        <td>{r.clockIn}</td>
                        <td>{r.clockOut ?? '-'}</td>
                        <td>
                          <span className={`status-badge ${r.status === 'done' ? 'present' : 'late'}`}>
                            {r.status === 'done' ? 'Present' : 'Working'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button><ChevronLeft size={18} /></button>
                <span>Page 1 of 1</span>
                <button><ChevronRight size={18} /></button>
              </div>
            </section>
          )}
        </div>

        {isAdmin && (
          <div className="summary-stats">
            <div className="stat-card glass">
              <span className="label">Today's Stats - Total Records</span>
              <span className="value">{records.length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">Present</span>
              <span className="value green">{records.filter((r) => r.status === 'done').length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">Working</span>
              <span className="value yellow">{records.filter((r) => r.status === 'working').length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
