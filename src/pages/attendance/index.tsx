import { useState } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import './attendance.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const mockRecords = [
  { name: 'Alex Johnson', schedule: [1, 1, 1, 1, 1, 0, 0], checkIn: '09:00', checkOut: '18:00', hours: '9h 0m', status: 'present' },
  { name: 'Maria Rodriguez', schedule: [1, 1, 1, 1, 1, 0, 0], checkIn: '09:45', checkOut: '18:30', hours: '8h 45m', status: 'late' },
  { name: 'David Chen', schedule: [1, 1, 1, 1, 1, 0, 0], checkIn: '09:00', checkOut: '18:00', hours: '9h 0m', status: 'present' },
  { name: 'Maria Snarr', schedule: [1, 1, 1, 1, 1, 0, 0], checkIn: '09:00', checkOut: '18:00', hours: '8h 0m', status: 'present' },
  { name: 'Alena Gtenrit', schedule: [1, 1, 1, 0, 0, 0, 0], checkIn: '-', checkOut: '-', hours: '-', status: 'absent' },
]

export function Attendance() {
  const { isAdmin } = useApp()
  const [filter, setFilter] = useState<'week' | 'month' | 'custom'>('month')

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <h1>Attendance</h1>
        <div className="header-actions">
          <button className="export-btn glass">
            <Download size={18} />
            Export
          </button>
          <div className="date-range glass">2024.02.01 - 2024.02.28</div>
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
                      <th>Total Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecords.map((r) => (
                      <tr key={r.name} className={r.status === 'late' ? 'late' : ''}>
                        <td>
                          <span className="record-avatar">{r.name[0]}</span>
                          {r.name}
                        </td>
                        <td>
                          {DAYS.map((_, i) => (
                            <span key={i} className={`dot ${r.schedule[i] ? 'on' : ''}`} />
                          ))}
                        </td>
                        <td>{r.checkIn}</td>
                        <td>{r.checkOut}</td>
                        <td>{r.hours}</td>
                        <td>
                          <span className={`status-badge ${r.status}`}>
                            {r.status === 'present' ? 'Present' : r.status === 'late' ? 'Late' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button><ChevronLeft size={18} /></button>
                <span>Page 1 of 5</span>
                <button><ChevronRight size={18} /></button>
              </div>
            </section>
          )}
        </div>

        {isAdmin && (
        <div className="summary-stats">
          <div className="stat-card glass">
            <span className="label">Today's Stats - Total Members</span>
            <span className="value">24</span>
          </div>
          <div className="stat-card glass">
            <span className="label">Present</span>
            <span className="value green">21</span>
          </div>
          <div className="stat-card glass">
            <span className="label">Late</span>
            <span className="value yellow">2</span>
          </div>
          <div className="stat-card glass">
            <span className="label">Absent</span>
            <span className="value red">1</span>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
