import { useState, useEffect } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import { getAttendanceByDate } from '../../shared/api/attendanceApi'
import type { AttendanceRecord } from '../../shared/api/attendanceApi'
import { exportAttendanceToCsv } from '../../shared/lib/exportCsv'
import './attendance.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Attendance() {
  const { isAdmin } = useApp()
  const [filter, setFilter] = useState<'week' | 'month' | 'custom'>('month')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    getAttendanceByDate(todayStr)
      .then(setRecords)
      .catch(() => {})
  }, [todayStr])

  const todayRecords = records.filter((r) => r.workDate === todayStr)
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExport = () => {
    exportAttendanceToCsv(
      records.map((r) => ({
        id: String(r.id),
        userId: String(r.memberId),
        userName: r.memberName,
        date: r.workDate,
        clockIn: r.checkInTime?.slice(11, 16) ?? '',
        clockOut: r.checkOutTime?.slice(11, 16),
        status: r.status === 'LEFT' ? 'done' : 'working',
      })),
      todayStr
    )
  }

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <h1>Attendance</h1>
        <div className="header-actions">
          {isAdmin && (
            <button className="export-btn glass" onClick={handleExport}>
              <Download size={18} />
              Export CSV
            </button>
          )}
          <div className="date-range glass">{todayStr}</div>
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
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((r) => (
                      <tr key={r.id} className={r.status === 'WORKING' ? 'late' : ''}>
                        <td>
                          <span className="record-avatar">{r.memberName[0]}</span>
                          {r.memberName}
                        </td>
                        <td>
                          {DAYS.map((_, i) => (
                            <span key={i} className={`dot ${i < 5 ? 'on' : ''}`} />
                          ))}
                        </td>
                        <td>{r.checkInTime?.slice(11, 16) ?? '-'}</td>
                        <td>{r.checkOutTime?.slice(11, 16) ?? '-'}</td>
                        <td>{r.workDate}</td>
                        <td>
                          <span className={`status-badge ${r.status === 'LEFT' ? 'present' : 'late'}`}>
                            {r.status === 'LEFT' ? 'Present' : 'Working'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={18} /></button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={18} /></button>
              </div>
            </section>
          )}
        </div>

        {isAdmin && (
          <div className="summary-stats">
            <div className="stat-card glass">
              <span className="label">오늘 총 기록</span>
              <span className="value">{todayRecords.length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">Present</span>
              <span className="value green">{todayRecords.filter((r) => r.status === 'done').length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">Working</span>
              <span className="value yellow">{todayRecords.filter((r) => r.status === 'working').length}</span>
            </div>
            <div className="stat-card glass">
              <span className="label">Absent</span>
              <span className="value red">{todayRecords.filter((r) => r.status === 'absent').length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
