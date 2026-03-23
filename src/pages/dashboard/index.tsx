import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckSquare } from 'lucide-react'
import { AnimatedClockRing } from '../../features/attendance/ui'
import { useWorkSession } from '../../features/attendance/model/useWorkSession'
import { useEvents } from '../../features/calendar/model/EventsProvider'
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
  // "HH:mm" → "오전/오후 H:mm"
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
  const [now, setNow] = useState(() => new Date())
  const { status, clockIn, clockOut, handleClockClick, errorMessage, toastType, clearError, isLoading } =
    useWorkSession()
  const { getEventsByDate } = useEvents()
  const { channels, getMessagesByChannel, activeChannelId } = useChat()
  const { getTasksByDate } = useTasks()

  const today = getTodayStr()
  const todayEvents = getEventsByDate(today)
  const recentMessages = getMessagesByChannel(activeChannelId).slice(-3)
  const todayTasks = getTasksByDate(today)
  const activeChannel = channels.find((c) => c.id === activeChannelId)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 클락 카드 중앙 텍스트
  let centerText = ''
  let centerClass = 'clock-time'

  if (isLoading) {
    centerText = '...'
    centerClass += ' clock-time-loading'
  } else if (status === 'idle') {
    centerText = '출근'
    centerClass += ' clock-time-start'
  } else if (status === 'working') {
    centerText = '퇴근'
    centerClass += ' clock-time-leave'
  } else {
    centerText = '완료'
    centerClass += ' clock-time-done'
  }

  const workedDuration =
    status === 'working' && clockIn
      ? formatDuration(now.getTime() - clockIn.getTime())
      : status === 'done' && clockIn && clockOut
      ? formatDuration(clockOut.getTime() - clockIn.getTime())
      : null

  return (
    <div className="dashboard">
      {errorMessage && (
        <Toast message={errorMessage} type={toastType} onClose={clearError} />
      )}
      <div className="dashboard-grid">
        {/* 출퇴근 버튼 */}
        <button
          type="button"
          className={`card clock-card glass clock-card-link ${isLoading ? 'clock-card-loading' : ''}`}
          onClick={isLoading ? undefined : handleClockClick}
          disabled={isLoading}
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
          {workedDuration && (
            <span className="clock-duration">{workedDuration}</span>
          )}
          {!isLoading && status === 'idle' && (
            <span className="clock-hint">클릭하여 출근</span>
          )}
        </button>

        {/* 오늘 일정 */}
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
              {todayEvents.slice(0, 4).map((ev) => (
                <li key={ev.id} className="schedule-item purple">
                  <Calendar size={16} className="schedule-icon" />
                  <div>
                    <span className="schedule-time">
                      {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                    </span>
                    <span className="schedule-title">{ev.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {todayEvents.length > 4 && (
            <Link to="/calendar" className="view-all">+{todayEvents.length - 4}개 더 보기</Link>
          )}
        </div>

        {/* 채팅 미리보기 */}
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

        {/* 오늘 할 일 */}
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
                  <span
                    className="task-dot"
                    style={{ background: priorityColors[task.priority] }}
                  />
                  <span className="task-title">{task.title}</span>
                  {task.done && <span className="task-done-badge">완료</span>}
                </li>
              ))}
            </ul>
          )}
          {todayTasks.length > 5 && (
            <Link to="/calendar" className="view-all">+{todayTasks.length - 5}개 더 보기</Link>
          )}
        </div>
      </div>
    </div>
  )
}
