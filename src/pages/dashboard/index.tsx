import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Users, User } from 'lucide-react'
import { AnimatedClockRing } from '../../features/attendance/ui'
import { useWorkSession } from '../../features/attendance/model/useWorkSession'
import { Toast } from '../../shared/ui/Toast'
import './dashboard.css'

function formatDuration(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function Dashboard() {
  const [now, setNow] = useState(() => new Date())
  const [hover, setHover] = useState(false)
  const { status, clockIn, clockOut, handleClockClick, errorMessage, clearError } = useWorkSession()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  let centerText = ''
  let centerClass = 'clock-time'

  if (status === 'idle') {
    centerText = '출근'
    centerClass += ' clock-time-start'
  } else if (status === 'working') {
    if (hover) {
      centerText = '퇴근'
      centerClass += ' clock-time-leave'
    } else {
      const base = clockIn ? now.getTime() - clockIn.getTime() : 0
      centerText = formatDuration(base)
    }
  } else {
    const base = clockIn && clockOut ? clockOut.getTime() - clockIn.getTime() : 0
    centerText = formatDuration(base)
  }

  return (
    <div className="dashboard">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={clearError} />
      )}
      <div className="dashboard-grid">
        <button
          type="button"
          className="card clock-card glass clock-card-link"
          onClick={handleClockClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className="clock-outer">
            <AnimatedClockRing
              status={status}
              clockIn={clockIn}
              clockOut={clockOut}
              now={now}
              variant={status === 'idle' ? 'start' : status === 'working' && hover ? 'leave' : 'default'}
            />
            <div className="clock-inner">
              <span className={centerClass}>{centerText}</span>
            </div>
          </div>
        </button>

        <div className="card schedule-card glass">
          <h3>Today's Schedule</h3>
          <ul>
            <li className="schedule-item purple">
              <Calendar size={18} className="schedule-icon" />
              <div>
                <span className="schedule-time">10:00 AM</span>
                <span className="schedule-title">Club Meeting</span>
              </div>
            </li>
            <li className="schedule-item grey">
              <Clock size={18} className="schedule-icon" />
              <div>
                <span className="schedule-time">12:00 PM</span>
                <span className="schedule-title">Lunch Break</span>
              </div>
            </li>
            <li className="schedule-item blue">
              <Users size={18} className="schedule-icon" />
              <div>
                <span className="schedule-time">02:00 PM</span>
                <span className="schedule-title">Project Sync</span>
              </div>
            </li>
            <li className="schedule-item purple">
              <User size={18} className="schedule-icon" />
              <div>
                <span className="schedule-time">04:30 PM</span>
                <span className="schedule-title">Design Review</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="card chat-preview glass">
          <h3>Team Chat</h3>
          <ul>
            <li>
              <span className="avatar">S</span>
              <div className="chat-msg-content">
                <strong>Sarah Chen</strong>
                <span className="msg-text">Can we review the proposal?</span>
                <span className="ts">09:05 AM</span>
              </div>
            </li>
            <li>
              <span className="avatar">A</span>
              <div className="chat-msg-content">
                <strong>Alex Johnson</strong>
                <span className="msg-text">Shared the latest files.</span>
                <span className="ts">08:50 AM</span>
              </div>
            </li>
            <li>
              <span className="avatar">D</span>
              <div className="chat-msg-content">
                <strong>David Lee</strong>
                <span className="msg-text">Good morning everyone!</span>
                <span className="ts">08:45 AM</span>
              </div>
            </li>
          </ul>
          <Link to="/chat" className="view-all">
            View All
          </Link>
        </div>

        <div className="card stats-card glass">
          <h3>Attendance Rate</h3>
          <div className="big-stat">92%</div>
          <div className="stat-tabs">
            <span className="active">Today</span>
            <span>Last Week</span>
          </div>
          <div className="attendance-progress" />
        </div>

        <div className="card members-card glass">
          <h3>Active Members</h3>
          <div className="big-stat">
            45
            <span className="up">↑</span>
            <span className="increase">7</span>
          </div>
          <p>45 Online</p>
          <p className="total">108 Total</p>
        </div>
      </div>
    </div>
  )
}
