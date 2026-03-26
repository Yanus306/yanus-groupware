import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, CheckSquare, X } from 'lucide-react'
import { AnimatedClockRing } from '../../features/attendance/ui'
import { useWorkSession } from '../../features/attendance/model/useWorkSession'
import { useWorkSchedule } from '../../features/attendance/model/useWorkSchedule'
import { useEvents } from '../../features/calendar/model/EventsProvider'
import type { CalendarEvent } from '../../features/calendar/model'
import { useChat } from '../../features/chat/model/ChatProvider'
import { useTasks } from '../../features/tasks/model/TasksProvider'
import { getTodayStr } from '../../shared/lib/date'
import { Toast } from '../../shared/ui/Toast'
import './dashboard.css'

function formatDuration(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? '오후' : '오전'
  const h12 = h % 12 || 12
  return `${period} ${h12}:${String(m).padStart(2, '0')}`
}

function formatMsgTime(date: Date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const period = h >= 12 ? '오후' : '오전'
  const h12 = h % 12 || 12
  return `${period} ${h12}:${String(m).padStart(2, '0')}`
}

const priorityColors: Record<string, string> = {
  high: 'var(--error)',
  medium: 'var(--accent-purple)',
  low: 'var(--text-secondary)',
}

export function Dashboard() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const { status, clockIn, clockOut, handleClockClick, errorMessage, toastType, clearError, isLoading } =
    useWorkSession()
  const { workDays, daySchedules } = useWorkSchedule()
  const { getEventsByDate } = useEvents()
  const { channels, getMessagesByChannel, activeChannelId } = useChat()
  const { getTasksByDate, toggleTaskDone } = useTasks()

  const today = getTodayStr()
  const todayEvents = getEventsByDate(today)
  const recentMessages = getMessagesByChannel(activeChannelId).slice(-3)
  const todayTasks = getTasksByDate(today)
  const activeChannel = channels.find((channel) => channel.id === activeChannelId)
  const todayIndex = (new Date().getDay() + 6) % 7
  const todayWorkEnabled = workDays[todayIndex]
  const todayWorkSchedule = daySchedules[todayIndex]

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  let centerText = ''
  let centerClass = 'clock-time'

  if (isLoading) {
    centerText = '...'
    centerClass += ' clock-time-loading'
  } else if (status === 'idle') {
    centerText = '출근'
    centerClass += ' clock-time-start'
  } else if (status === 'working') {
    centerText = clockIn ? formatDuration(now.getTime() - clockIn.getTime()) : '00:00'
    centerClass += ' clock-time-elapsed'
  } else {
    centerText = clockIn && clockOut
      ? formatDuration(clockOut.getTime() - clockIn.getTime())
      : '완료'
    centerClass += ' clock-time-done'
  }

  const todayScheduleSummary = todayWorkEnabled
    ? `오늘 근무 예정 ${todayWorkSchedule.checkInTime} - ${todayWorkSchedule.checkOutTime}`
    : '오늘은 휴무입니다'

  const todayScheduleCaption = status === 'working'
    ? '현재 출근 상태와 함께 근무 일정을 확인할 수 있습니다.'
    : status === 'done'
      ? '오늘 근무가 종료되어 예정 시간과 함께 비교할 수 있습니다.'
      : '출근 전에도 오늘 근무 예정 시간을 바로 확인할 수 있습니다.'

  return (
    <div className="dashboard">
      {errorMessage && (
        <Toast message={errorMessage} type={toastType} onClose={clearError} />
      )}
      <div className="dashboard-grid">
        <div className={`card clock-card glass ${isLoading ? 'clock-card-loading' : ''}`}>
          <button
            type="button"
            className={`clock-ring-btn ${status === 'idle' && !isLoading ? 'clickable' : ''}`}
            onClick={status === 'idle' && !isLoading ? handleClockClick : undefined}
            disabled={isLoading || status !== 'idle'}
            aria-label="출근하기"
          >
            <div className="clock-outer">
              <AnimatedClockRing
                status={status}
                clockIn={clockIn}
                clockOut={clockOut}
                now={now}
                variant={
                  isLoading ? 'default'
                  : status === 'idle' ? 'start'
                  : status === 'working' ? 'leave'
                  : 'default'
                }
              />
              <div className="clock-inner">
                <span className={centerClass}>{centerText}</span>
              </div>
            </div>
          </button>

          <div className="clock-footer">
            <div className={`clock-schedule-pill ${todayWorkEnabled ? 'active' : 'off'}`}>
              {todayScheduleSummary}
            </div>
            <span className="clock-schedule-caption">{todayScheduleCaption}</span>
            {status === 'idle' && !isLoading && (
              <span className="clock-hint">클릭하여 출근</span>
            )}
            {status === 'working' && clockIn && (
              <span className="clock-checkin-time">
                출근 {formatMsgTime(clockIn)}
              </span>
            )}
            {status === 'done' && clockIn && clockOut && (
              <span className="clock-checkin-time">
                {formatMsgTime(clockIn)} - {formatMsgTime(clockOut)}
              </span>
            )}
            {status === 'working' && !isLoading && (
              <button
                type="button"
                className="clockout-btn"
                onClick={handleClockClick}
                disabled={isLoading}
              >
                퇴근하기
              </button>
            )}
          </div>
        </div>

        <div className="card schedule-card glass">
          <h3>
            <Calendar size={16} />
            오늘 일정
          </h3>
          {todayEvents.length === 0 ? (
            <div className="empty-state">
              <p>오늘 등록된 일정이 없습니다</p>
              <Link to="/calendar" className="view-all">캘린더 보기</Link>
            </div>
          ) : (
            <ul>
              {todayEvents.slice(0, 4).map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className="schedule-item schedule-item-btn purple"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Calendar size={16} className="schedule-icon" />
                    <div>
                      <span className="schedule-time">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                      <span className="schedule-title">{event.title}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {todayEvents.length > 4 && (
            <Link to="/calendar" className="view-all">+{todayEvents.length - 4}개 더 보기</Link>
          )}
        </div>

        <div className="card chat-preview glass">
          <h3>
            {activeChannel ? `# ${activeChannel.name}` : '팀 채팅'}
          </h3>
          {recentMessages.length === 0 ? (
            <div className="empty-state">
              <p>최근 메시지가 없습니다</p>
            </div>
          ) : (
            <ul>
              {recentMessages.map((msg) => (
                <li key={msg.id}>
                  <span className="avatar">{msg.userName[0]}</span>
                  <div className="chat-msg-content">
                    <strong>{msg.userName}</strong>
                    <span className="msg-text">{msg.content ?? '(파일)'}</span>
                    <span className="ts">{formatMsgTime(msg.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/chat" className="view-all">채팅 열기</Link>
        </div>

        <div className="card tasks-card glass">
          <h3>
            <CheckSquare size={16} />
            오늘 할 일
          </h3>
          {todayTasks.length === 0 ? (
            <div className="empty-state">
              <p>오늘 등록된 할 일이 없습니다</p>
              <Link to="/calendar" className="view-all">할 일 보기</Link>
            </div>
          ) : (
            <ul className="tasks-list">
              {todayTasks.slice(0, 5).map((task) => (
                <li key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
                  <button
                    type="button"
                    className={`task-check-btn ${task.done ? 'done' : ''}`}
                    onClick={() => toggleTaskDone(task.id)}
                    aria-label={`${task.title} ${task.done ? '미완료로 변경' : '완료 처리'}`}
                  >
                    <span className="task-dot" style={{ background: priorityColors[task.priority] }} />
                  </button>
                  <span className="task-title">{task.title}</span>
                  <button
                    type="button"
                    className={`task-done-badge ${task.done ? 'done' : ''}`}
                    onClick={() => toggleTaskDone(task.id)}
                  >
                    {task.done ? '완료됨' : '완료 처리'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {todayTasks.length > 5 && (
            <Link to="/calendar" className="view-all">+{todayTasks.length - 5}개 더 보기</Link>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div className="dashboard-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="dashboard-detail-modal glass" onClick={(event) => event.stopPropagation()}>
            <div className="dashboard-detail-head">
              <h3>오늘 일정 상세</h3>
              <button type="button" className="dashboard-detail-close" onClick={() => setSelectedEvent(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="dashboard-detail-body">
              <strong>{selectedEvent.title}</strong>
              <p>
                {selectedEvent.startDate} {formatTime(selectedEvent.startTime)} - {selectedEvent.endDate} {formatTime(selectedEvent.endTime)}
              </p>
              <span>작성자: {selectedEvent.createdBy}</span>
            </div>
            <div className="dashboard-detail-actions">
              <button type="button" className="dashboard-secondary-btn" onClick={() => setSelectedEvent(null)}>
                닫기
              </button>
              <button
                type="button"
                className="dashboard-primary-btn"
                onClick={() => {
                  setSelectedEvent(null)
                  navigate('/calendar')
                }}
              >
                캘린더에서 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
