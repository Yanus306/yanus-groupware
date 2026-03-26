import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Calendar, CheckSquare, Pencil, Trash2, X } from 'lucide-react'
import { AnimatedClockRing } from '../../features/attendance/ui'
import { useWorkSession } from '../../features/attendance/model/useWorkSession'
import { useWorkSchedule } from '../../features/attendance/model/useWorkSchedule'
import { useEvents } from '../../features/calendar/model/EventsProvider'
import type { CalendarEvent } from '../../features/calendar/model'
import { useChat } from '../../features/chat/model/ChatProvider'
import { useTasks } from '../../features/tasks/model/TasksProvider'
import { getTodayStr } from '../../shared/lib/date'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Toast } from '../../shared/ui/Toast'
import './dashboard.css'

function formatDuration(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? '오후' : '오전'
  const displayHours = hours % 12 || 12
  return `${period} ${displayHours}:${String(minutes).padStart(2, '0')}`
}

function formatMessageTime(date: Date) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? '오후' : '오전'
  const displayHours = hours % 12 || 12
  return `${period} ${displayHours}:${String(minutes).padStart(2, '0')}`
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + minutes
}

const priorityColors: Record<string, string> = {
  high: 'var(--error)',
  medium: 'var(--accent-purple)',
  low: 'var(--text-secondary)',
}

const priorityLabels: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export function Dashboard() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  })

  const {
    status,
    clockIn,
    clockOut,
    handleClockClick,
    errorMessage,
    toastType,
    clearError,
    isLoading,
  } = useWorkSession()
  const { workDays, daySchedules } = useWorkSchedule()
  const { getEventsByDate, updateEvent, deleteEvent } = useEvents()
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
  const nowMinutes = (now.getHours() * 60) + now.getMinutes()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const attendanceAlert = useMemo(() => {
    if (!todayWorkEnabled) {
      if (status === 'working' || status === 'done') {
        return {
          tone: 'info',
          title: '휴무일에도 출근 기록이 있습니다',
          description: '오늘은 휴무일로 설정되어 있지만 실제 출퇴근 기록이 남아 있습니다.',
        }
      }

      return null
    }

    const scheduledStart = toMinutes(todayWorkSchedule.checkInTime)
    const scheduledEnd = toMinutes(todayWorkSchedule.checkOutTime)

    if (status === 'idle' && nowMinutes >= scheduledStart + 15) {
      return {
        tone: 'warning',
        title: '출근 예정 시간이 지났습니다',
        description: `${todayWorkSchedule.checkInTime}까지 출근 예정이었어요. 출근 여부를 확인해 주세요.`,
      }
    }

    if (status === 'done' && clockOut) {
      const actualEnd = (clockOut.getHours() * 60) + clockOut.getMinutes()
      if (actualEnd + 30 < scheduledEnd) {
        return {
          tone: 'warning',
          title: '예정보다 일찍 퇴근했습니다',
          description: `예정 퇴근 시간은 ${todayWorkSchedule.checkOutTime}입니다.`,
        }
      }
    }

    if (status === 'working' && nowMinutes >= scheduledEnd + 30) {
      return {
        tone: 'info',
        title: '근무 시간이 길어지고 있습니다',
        description: `예정 퇴근 시간 ${todayWorkSchedule.checkOutTime}보다 30분 이상 지났습니다.`,
      }
    }

    return {
      tone: 'success',
      title: '오늘 근무 일정이 정상입니다',
      description: `${todayWorkSchedule.checkInTime} - ${todayWorkSchedule.checkOutTime} 기준으로 확인 중입니다.`,
    }
  }, [clockOut, nowMinutes, status, todayWorkEnabled, todayWorkSchedule.checkInTime, todayWorkSchedule.checkOutTime])

  const openEventDetail = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEditingEvent(false)
    setEventForm({
      title: event.title,
      startDate: event.startDate,
      startTime: event.startTime,
      endDate: event.endDate,
      endTime: event.endTime,
    })
  }

  const closeEventDetail = () => {
    setSelectedEvent(null)
    setIsEditingEvent(false)
  }

  const handleSaveEvent = () => {
    if (!selectedEvent) return
    const title = eventForm.title.trim()
    if (!title) return

    updateEvent(selectedEvent.id, {
      title,
      startDate: eventForm.startDate,
      startTime: eventForm.startTime,
      endDate: eventForm.endDate,
      endTime: eventForm.endTime,
    })
    closeEventDetail()
  }

  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    deleteEvent(selectedEvent.id)
    closeEventDetail()
  }

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
            {attendanceAlert && (
              <div className={`attendance-alert-card ${attendanceAlert.tone}`}>
                <div className="attendance-alert-title">
                  <AlertTriangle size={15} />
                  <span>{attendanceAlert.title}</span>
                </div>
                <p>{attendanceAlert.description}</p>
              </div>
            )}
            {status === 'idle' && !isLoading && (
              <span className="clock-hint">클릭하여 출근</span>
            )}
            {status === 'working' && clockIn && (
              <span className="clock-checkin-time">
                출근 {formatMessageTime(clockIn)}
              </span>
            )}
            {status === 'done' && clockIn && clockOut && (
              <span className="clock-checkin-time">
                {formatMessageTime(clockIn)} - {formatMessageTime(clockOut)}
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
            <EmptyState
              compact
              title="오늘 등록된 일정이 없습니다"
              action={<Link to="/calendar" className="view-all">캘린더 보기</Link>}
            />
          ) : (
            <ul>
              {todayEvents.slice(0, 4).map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className="schedule-item schedule-item-btn purple"
                    onClick={() => openEventDetail(event)}
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
            <EmptyState compact title="최근 메시지가 없습니다" />
          ) : (
            <ul>
              {recentMessages.map((message) => (
                <li key={message.id}>
                  <span className="avatar">{message.userName[0]}</span>
                  <div className="chat-msg-content">
                    <strong>{message.userName}</strong>
                    <span className="msg-text">{message.content ?? '(파일)'}</span>
                    <span className="ts">{formatMessageTime(message.timestamp)}</span>
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
            <EmptyState
              compact
              title="오늘 등록된 할 일이 없습니다"
              action={<Link to="/calendar" className="view-all">할 일 보기</Link>}
            />
          ) : (
            <ul className="tasks-list">
              {todayTasks.slice(0, 5).map((task) => {
                const dueSoon = !task.done && nowMinutes >= toMinutes(task.time) - 90

                return (
                  <li
                    key={task.id}
                    className={`task-item ${task.done ? 'done' : ''} ${dueSoon ? 'due-soon' : ''}`}
                  >
                    <button
                      type="button"
                      className={`task-check-btn ${task.done ? 'done' : ''}`}
                      onClick={() => toggleTaskDone(task.id)}
                      aria-label={`${task.title} ${task.done ? '미완료로 변경' : '완료 처리'}`}
                    >
                      <span className="task-dot" style={{ background: priorityColors[task.priority] }} />
                    </button>
                    <div className="task-copy">
                      <span className="task-title">{task.title}</span>
                      <div className="task-meta-row">
                        <span className={`task-priority-badge ${task.priority}`}>
                          {priorityLabels[task.priority]}
                        </span>
                        <span className={`task-deadline-badge ${dueSoon ? 'urgent' : ''}`}>
                          {task.time} {dueSoon ? '마감 임박' : '까지'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`task-done-badge ${task.done ? 'done' : ''}`}
                      onClick={() => toggleTaskDone(task.id)}
                    >
                      {task.done ? '완료됨' : '완료 처리'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {todayTasks.length > 5 && (
            <Link to="/calendar" className="view-all">+{todayTasks.length - 5}개 더 보기</Link>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div className="dashboard-modal-overlay" onClick={closeEventDetail}>
          <div className="dashboard-detail-modal glass" onClick={(event) => event.stopPropagation()}>
            <div className="dashboard-detail-head">
              <h3>오늘 일정 상세</h3>
              <button type="button" className="dashboard-detail-close" onClick={closeEventDetail}>
                <X size={18} />
              </button>
            </div>
            <div className="dashboard-detail-body">
              {isEditingEvent ? (
                <div className="dashboard-event-form">
                  <label>
                    제목
                    <input
                      value={eventForm.title}
                      onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <div className="dashboard-event-grid">
                    <label>
                      시작 날짜
                      <input
                        type="date"
                        value={eventForm.startDate}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, startDate: event.target.value }))}
                      />
                    </label>
                    <label>
                      시작 시간
                      <input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, startTime: event.target.value }))}
                      />
                    </label>
                    <label>
                      종료 날짜
                      <input
                        type="date"
                        value={eventForm.endDate}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, endDate: event.target.value }))}
                      />
                    </label>
                    <label>
                      종료 시간
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, endTime: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <strong>{selectedEvent.title}</strong>
                  <p>
                    {selectedEvent.startDate} {formatTime(selectedEvent.startTime)} - {selectedEvent.endDate} {formatTime(selectedEvent.endTime)}
                  </p>
                  <span>작성자: {selectedEvent.createdBy}</span>
                </>
              )}
            </div>
            <div className="dashboard-detail-actions">
              {isEditingEvent ? (
                <>
                  <button type="button" className="dashboard-secondary-btn" onClick={() => setIsEditingEvent(false)}>
                    취소
                  </button>
                  <button type="button" className="dashboard-primary-btn" onClick={handleSaveEvent}>
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="dashboard-secondary-btn" onClick={closeEventDetail}>
                    닫기
                  </button>
                  <button type="button" className="dashboard-secondary-btn" onClick={() => setIsEditingEvent(true)}>
                    <Pencil size={15} />
                    수정
                  </button>
                  <button type="button" className="dashboard-danger-btn" onClick={handleDeleteEvent}>
                    <Trash2 size={15} />
                    삭제
                  </button>
                  <button
                    type="button"
                    className="dashboard-primary-btn"
                    onClick={() => {
                      closeEventDetail()
                      navigate('/calendar')
                    }}
                  >
                    캘린더에서 보기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
