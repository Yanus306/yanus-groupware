import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Pencil, Trash2, User } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction'
import { TimeInput } from '../../components/TimeInput'
import { useApp } from '../../features/auth/model'
import { useTasks, type Task, type TaskPriority } from '../../features/tasks/model'
import { useEvents, type CalendarEvent } from '../../features/calendar/model'
import { useWorkSchedule } from '../../features/attendance/model/useWorkSchedule'
import { formatDateDisplay, getTodayStr } from '../../features/tasks/model'
import {
  formatTimeForDisplay,
  getCurrentTimeStr,
  formatEventRange,
  toOurEventFormat,
  taskToEventFormat,
  parseDateToStr,
  parseDateToTime,
} from '../../features/calendar/lib/calendarUtils'
import {
  ContextMenuModal,
  EditTaskModal,
  AddTaskModal,
  AddEventModal,
  EventDetailModal,
} from '../../features/calendar/ui'
import './calendar.css'

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

export function Calendar() {
  const { state } = useApp()
  const { tasks, addTask, updateTask, deleteTask, toggleTaskDone } = useTasks()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { workDays, daySchedules } = useWorkSchedule()

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => getTodayStr())
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'schedule'>('my')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTime, setNewTaskTime] = useState(() => getCurrentTimeStr())
  const [newTaskDate, setNewTaskDate] = useState(getTodayStr())
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium')
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [contextMenuModalOpen, setContextMenuModalOpen] = useState(false)
  const [pendingSelectRange, setPendingSelectRange] = useState<{ start: Date; end: Date } | null>(null)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [addEventModalOpen, setAddEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [eventDetailEditMode, setEventDetailEditMode] = useState(false)
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  })
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventStartDate, setNewEventStartDate] = useState(getTodayStr())
  const [newEventStartTime, setNewEventStartTime] = useState(() => getCurrentTimeStr())
  const [newEventEndDate, setNewEventEndDate] = useState(getTodayStr())
  const [newEventEndTime, setNewEventEndTime] = useState(() => {
    const n = new Date()
    n.setHours(n.getHours() + 1)
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  })
  const editInputRef = useRef<HTMLInputElement>(null)
  const addTaskInputRef = useRef<HTMLInputElement>(null)
  const addTaskModalInputRef = useRef<HTMLInputElement>(null)
  const addEventModalInputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<FullCalendar | null>(null)
  const prevViewKeyRef = useRef<string>('')
  const [isMonthTransitioning, setIsMonthTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next')
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState('')
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('medium')

  const todayStr = getTodayStr()
  const DELETE_ANIM_DURATION = 320

  // 권한 헬퍼 — admin/team_lead는 모두 편집 가능
  const isAdmin = state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'TEAM_LEAD'
  const canEditEvent = useCallback((event: CalendarEvent) =>
    isAdmin || event.createdBy === state.currentUser?.name,
    [isAdmin, state.currentUser],
  )
  const canEditTask = useCallback((task: Task) => {
    if (isAdmin) return true
    if (!task.isTeamTask) return true // 내 할일은 항상 본인 것
    // 팀 할일: 생성자(createdBy)만 편집 가능
    return task.createdBy === String(state.currentUser?.id)
  }, [isAdmin, state.currentUser])

  const handleAddTask = (closeModal?: boolean) => {
    const title = newTaskTitle.trim()
    if (!title) return
    const timeStr = newTaskTime ? formatTimeForDisplay(newTaskTime) : '--:--'
    let assigneeId: string | undefined
    let assigneeName: string | undefined
    if (activeTab === 'team' && newTaskAssigneeId) {
      if (newTaskAssigneeId === 'all') {
        assigneeId = 'all'
        assigneeName = '팀원 전체'
      } else {
        const assignee = state.users.find((u) => u.id === newTaskAssigneeId)
        assigneeId = newTaskAssigneeId
        assigneeName = assignee?.name
      }
    }
    addTask({ title, time: timeStr, date: newTaskDate, priority: newTaskPriority, done: false, isTeamTask: activeTab === 'team', assigneeId, assigneeName })
    setNewTaskTitle('')
    setNewTaskTime(getCurrentTimeStr())
    setNewTaskDate(getTodayStr())
    setNewTaskPriority('medium')
    setNewTaskAssigneeId('')
    if (closeModal) setAddTaskModalOpen(false)
  }

  const openAddTaskModal = (type: 'my' | 'team' = 'my') => {
    setActiveTab(type)
    setNewTaskTitle('')
    setNewTaskTime(getCurrentTimeStr())
    setNewTaskDate(selectedDateStr || getTodayStr())
    setNewTaskPriority('medium')
    setNewTaskAssigneeId('')
    setContextMenuModalOpen(false)
    setAddTaskModalOpen(true)
  }

  const openAddEventModal = (start?: Date, end?: Date) => {
    const range = start && end ? { start, end } : pendingSelectRange
    const date = selectedDateStr || getTodayStr()
    setNewEventTitle('')
    if (range) {
      setNewEventStartDate(parseDateToStr(range.start))
      setNewEventStartTime(parseDateToTime(range.start))
      setNewEventEndDate(parseDateToStr(range.end))
      setNewEventEndTime(parseDateToTime(range.end))
      setPendingSelectRange(null)
    } else {
      setNewEventStartDate(date)
      setNewEventStartTime(getCurrentTimeStr())
      setNewEventEndDate(date)
      const n = new Date()
      n.setHours(n.getHours() + 1)
      setNewEventEndTime(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`)
    }
    setContextMenuModalOpen(false)
    setAddEventModalOpen(true)
  }

  const handleAddEvent = (closeModal?: boolean) => {
    const title = newEventTitle.trim()
    if (!title) return
    addEvent({ title, startDate: newEventStartDate, startTime: newEventStartTime, endDate: newEventEndDate, endTime: newEventEndTime })
    setNewEventTitle('')
    setNewEventStartDate(getTodayStr())
    setNewEventStartTime(getCurrentTimeStr())
    setNewEventEndDate(getTodayStr())
    const n = new Date()
    n.setHours(n.getHours() + 1)
    setNewEventEndTime(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`)
    if (closeModal) setAddEventModalOpen(false)
  }

  const openEventDetail = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setEventDetailEditMode(false)
    setEditEventForm({ title: event.title, startDate: event.startDate, startTime: event.startTime, endDate: event.endDate, endTime: event.endTime })
  }

  const handleUpdateEvent = () => {
    if (!selectedEvent) return
    const title = editEventForm.title.trim()
    if (!title) return
    updateEvent(selectedEvent.id, { title, startDate: editEventForm.startDate, startTime: editEventForm.startTime, endDate: editEventForm.endDate, endTime: editEventForm.endTime })
    setSelectedEvent(null)
    setEventDetailEditMode(false)
  }

  const handleDeleteTaskWithAnimation = (taskId: string) => {
    setDeletingTaskId(taskId)
    setTimeout(() => { deleteTask(taskId); setDeletingTaskId(null) }, DELETE_ANIM_DURATION)
  }

  const handleDeleteEventWithAnimation = (eventId: string) => {
    setSelectedEvent(null)
    setEventDetailEditMode(false)
    setDeletingEventId(eventId)
    setTimeout(() => { deleteEvent(eventId); setDeletingEventId(null) }, DELETE_ANIM_DURATION)
  }

  const handleUpdateTask = () => {
    if (!editingTask) return
    const title = editInputRef.current?.value?.trim()
    if (!title) return
    let assigneeId: string | undefined
    let assigneeName: string | undefined
    if (editTaskAssigneeId) {
      if (editTaskAssigneeId === 'all') {
        assigneeId = 'all'
        assigneeName = '팀원 전체'
      } else {
        const assignee = state.users.find((u) => u.id === editTaskAssigneeId)
        assigneeId = editTaskAssigneeId
        assigneeName = assignee?.name
      }
    }
    updateTask(editingTask.id, { title, assigneeId, assigneeName, priority: editTaskPriority })
    setEditingTask(null)
  }

  const handleEventDetailFormChange = (f: Partial<typeof editEventForm>) => {
    if (Object.keys(f).length === 0) { setEventDetailEditMode(false); return }
    setEditEventForm((prev) => ({ ...prev, ...f }))
  }

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const dateStr = arg.dateStr.split('T')[0].slice(0, 10)
    setSelectedDateStr(dateStr)
    setNewTaskDate(dateStr)
    setNewEventStartDate(dateStr)
    setNewEventEndDate(dateStr)
    setPendingSelectRange(null)
    setContextMenuModalOpen(true)
  }, [])

  const handleSelect = useCallback((arg: { start: Date; end: Date }) => {
    setSelectedDateStr(parseDateToStr(arg.start))
    setNewTaskDate(parseDateToStr(arg.start))
    setPendingSelectRange({ start: arg.start, end: arg.end })
    setContextMenuModalOpen(true)
  }, [])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    arg.jsEvent.preventDefault()
    const ext = arg.event.extendedProps as { rawEvent?: CalendarEvent; rawTask?: Task; isTask?: boolean }
    if (ext?.isTask && ext.rawTask) {
      setEditingTask(ext.rawTask)
    } else if (ext?.rawEvent) {
      openEventDetail(ext.rawEvent)
    }
  }, [])

  const handleEventDrop = useCallback((arg: EventDropArg) => {
    const id = arg.event.id
    if (!id) return
    const ext = arg.event.extendedProps as { isTask?: boolean; rawEvent?: CalendarEvent; rawTask?: Task }
    const start = arg.event.start!
    const end = arg.event.end!
    if (ext?.isTask && id.startsWith('task-')) {
      if (!ext.rawTask || !canEditTask(ext.rawTask)) { arg.revert(); return }
      const taskId = id.replace(/^task-/, '')
      const newDate = parseDateToStr(start)
      const time24 = parseDateToTime(start)
      // PUT 백엔드 호환: 기존 title·priority 함께 전송
      updateTask(taskId, {
        title: ext.rawTask.title,
        date: newDate,
        time: formatTimeForDisplay(time24),
        priority: ext.rawTask.priority,
      })
    } else {
      if (!ext.rawEvent || !canEditEvent(ext.rawEvent)) { arg.revert(); return }
      updateEvent(id, {
        title: ext.rawEvent.title,
        startDate: parseDateToStr(start),
        startTime: parseDateToTime(start),
        endDate: parseDateToStr(end),
        endTime: parseDateToTime(end),
      })
    }
  }, [updateEvent, updateTask, canEditEvent, canEditTask])

  const handleDatesSet = useCallback((arg: { start: Date; end: Date; view: { type: string } }) => {
    const key = `${arg.view.type}-${arg.start.getFullYear()}-${arg.start.getMonth()}`
    if (prevViewKeyRef.current && prevViewKeyRef.current !== key) {
      const [, prevY, prevM] = prevViewKeyRef.current.split('-').map(Number)
      const prevDate = new Date(prevY, prevM, 1).getTime()
      const currDate = arg.start.getTime()
      setTransitionDirection(currDate > prevDate ? 'next' : 'prev')
      setIsMonthTransitioning(true)
      setTimeout(() => setIsMonthTransitioning(false), 320)
    }
    prevViewKeyRef.current = key
  }, [])

  const handleEventResize = useCallback((arg: EventResizeDoneArg) => {
    const id = arg.event.id
    if (!id) return
    const ext = arg.event.extendedProps as { isTask?: boolean; rawEvent?: CalendarEvent }
    if (ext?.isTask && id.startsWith('task-')) return
    if (ext.rawEvent && !canEditEvent(ext.rawEvent)) { arg.revert(); return }
    const start = arg.event.start!
    const end = arg.event.end!
    updateEvent(id, { startDate: parseDateToStr(start), startTime: parseDateToTime(start), endDate: parseDateToStr(end), endTime: parseDateToTime(end) })
  }, [updateEvent, canEditEvent])

  useEffect(() => {
    if (editingTask) {
      setEditTaskAssigneeId(editingTask.assigneeId || '')
      setEditTaskPriority(editingTask.priority)
      editInputRef.current?.focus()
    }
  }, [editingTask])

  useEffect(() => { if (addTaskModalOpen) addTaskModalInputRef.current?.focus() }, [addTaskModalOpen])
  useEffect(() => { if (addEventModalOpen) addEventModalInputRef.current?.focus() }, [addEventModalOpen])

  const filteredTasks = useMemo(() => {
    return activeTab === 'my' ? tasks.filter((t) => !t.isTeamTask) : tasks.filter((t) => t.isTeamTask)
  }, [tasks, activeTab])

  // 캘린더에는 내 할일 + 팀 할일 모두 표시 (사이드바는 탭으로 필터)
  const fullCalendarEvents = useMemo(
    () => [...events.map(toOurEventFormat), ...tasks.filter((t) => !t.done).map(taskToEventFormat)],
    [events, tasks]
  )

  // 근무 일정 → FullCalendar businessHours (0=Sun, 1=Mon, ..., 6=Sat)
  // useWorkSchedule 인덱스: 0=Mon, ..., 5=Sat, 6=Sun
  const businessHours = useMemo(() =>
    workDays
      .map((isWork, i) => {
        if (!isWork) return null
        const fcDay = i === 6 ? 0 : i + 1
        return {
          daysOfWeek: [fcDay],
          startTime: daySchedules[i].checkInTime,
          endTime: daySchedules[i].checkOutTime,
        }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null),
    [workDays, daySchedules]
  )

  const todayTasks = useMemo(
    () => filteredTasks.filter((t) => t.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)),
    [filteredTasks, todayStr]
  )

  const upcomingEventsGrouped = useMemo(() => {
    const future = events
      .filter((e) => e.endDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.startTime.localeCompare(b.startTime))
    const byDate = new Map<string, typeof events>()
    future.forEach((e) => { const list = byDate.get(e.startDate) || []; list.push(e); byDate.set(e.startDate, list) })
    return Array.from(byDate.entries()).map(([date, items]) => ({ date: formatDateDisplay(date, new Date()), dateStr: date, items }))
  }, [events, todayStr])

  const upcomingTasksGrouped = useMemo(() => {
    const future = filteredTasks
      .filter((t) => t.date > todayStr && !t.done)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    const byDate = new Map<string, Task[]>()
    future.forEach((t) => { const list = byDate.get(t.date) || []; list.push(t); byDate.set(t.date, list) })
    return Array.from(byDate.entries()).map(([date, items]) => ({ date: formatDateDisplay(date, new Date()), dateStr: date, items }))
  }, [filteredTasks, todayStr])

  const TaskItemRow = ({ t, showCheckbox = true, showAssignee = true }: { t: Task; showCheckbox?: boolean; showAssignee?: boolean }) => {
    const canEdit = canEditTask(t)
    return (
      <div key={t.id} className={`task-item ${t.done ? 'done' : ''} ${deletingTaskId === t.id ? 'deleting' : ''}`}>
        {showCheckbox && (
          <span className="task-checkbox" onClick={() => toggleTaskDone(t.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleTaskDone(t.id)}>
            {t.done ? '✓' : ''}
          </span>
        )}
        <div className="task-info">
          <span className="task-title">{t.title}</span>
          <span className="task-meta">{t.time} · <span className={`priority-dot ${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span></span>
        </div>
        <div className="task-actions">
          {showAssignee && t.assigneeName && <span className="assignee" title={t.assigneeName}><User size={14} /></span>}
          {canEdit && <button onClick={() => setEditingTask(t)} aria-label="수정"><Pencil size={14} /></button>}
          {canEdit && <button onClick={(e) => { e.stopPropagation(); handleDeleteTaskWithAnimation(t.id) }} aria-label="삭제"><Trash2 size={14} /></button>}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-page">
      <div className="calendar-main">
        <div className={`fullcalendar-wrapper ${isMonthTransitioning ? 'fc-transitioning' : ''} ${isMonthTransitioning ? `fc-direction-${transitionDirection}` : ''}`}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
            buttonText={{ today: '오늘', month: '월', week: '주', day: '일', list: '목록' }}
            locale={koLocale}
            firstDay={0}
            selectable
            selectMirror
            editable
            dayMaxEvents={3}
            events={fullCalendarEvents}
            businessHours={businessHours}
            dateClick={handleDateClick}
            select={handleSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
          />
        </div>
      </div>

      <aside className="tasks-sidebar">
        <div className="tasks-tabs">
          <span className={activeTab === 'my' ? 'active' : ''} onClick={() => setActiveTab('my')}>내 할일</span>
          <span className={activeTab === 'team' ? 'active' : ''} onClick={() => setActiveTab('team')}>팀 할일</span>
          <span className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}>일정</span>
        </div>

        {activeTab !== 'schedule' && (
          <div className="add-task-inline add-task-vertical">
            <div className="add-task-row">
              <label>할일</label>
              <input ref={addTaskInputRef} className="add-task-title" placeholder="할일 제목" value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} />
            </div>
            <div className="add-task-row">
              <label>마감 시간</label>
              <TimeInput value={newTaskTime} onChange={setNewTaskTime} />
            </div>
            <div className="add-task-row">
              <label>마감 날짜</label>
              <input type="date" className="add-task-date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} />
            </div>
            <div className="add-task-row">
              <label>중요도</label>
              <select className="add-task-priority" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}>
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {activeTab === 'team' && (
              <div className="add-task-row">
                <label>담당자</label>
                <select className="add-task-assignee" value={newTaskAssigneeId} onChange={(e) => setNewTaskAssigneeId(e.target.value)}>
                  <option value="">담당자 없음</option>
                  <option value="all">팀원 전체</option>
                  {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className="add-task-row">
              <button className="add-task-inline-btn" onClick={() => handleAddTask()}>추가</button>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="add-task-inline add-task-vertical">
            <div className="add-task-row">
              <label>제목</label>
              <input className="add-task-title" placeholder="일정 제목" value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()} />
            </div>
            <div className="add-task-row">
              <label>시작 (날짜 · 시간)</label>
              <div className="add-event-datetime">
                <input type="date" className="add-task-date" value={newEventStartDate} onChange={(e) => setNewEventStartDate(e.target.value)} />
                <TimeInput value={newEventStartTime} onChange={setNewEventStartTime} />
              </div>
            </div>
            <div className="add-task-row">
              <label>종료 (날짜 · 시간)</label>
              <div className="add-event-datetime">
                <input type="date" className="add-task-date" value={newEventEndDate} onChange={(e) => setNewEventEndDate(e.target.value)} />
                <TimeInput value={newEventEndTime} onChange={setNewEventEndTime} />
              </div>
            </div>
            <div className="add-task-row">
              <button className="add-task-inline-btn" onClick={() => handleAddEvent()}>추가</button>
            </div>
          </div>
        )}

        {activeTab !== 'schedule' && (
          <>
            <section className="today-tasks">
              <h4>오늘의 할일</h4>
              {todayTasks.length === 0 ? (
                <p className="empty-hint">오늘 예정된 태스크가 없습니다</p>
              ) : (
                todayTasks.map((t) => <TaskItemRow key={t.id} t={t} showAssignee={activeTab === 'team'} />)
              )}
            </section>
            <section className="upcoming-tasks">
              <h4>예정</h4>
              {upcomingTasksGrouped.length === 0 ? (
                <p className="empty-hint">예정된 태스크가 없습니다</p>
              ) : (
                upcomingTasksGrouped.map(({ date, items }) => (
                  <div key={date} className="upcoming-group">
                    <div className="upcoming-date">{date}</div>
                    {items.map((t) => <TaskItemRow key={t.id} t={t} showAssignee={activeTab === 'team'} />)}
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {activeTab === 'schedule' && (
          <section className="upcoming-tasks">
            <h4>예정 일정</h4>
            {upcomingEventsGrouped.length === 0 ? (
              <p className="empty-hint">예정된 일정이 없습니다</p>
            ) : (
              upcomingEventsGrouped.map(({ date, dateStr, items }) => (
                <div key={dateStr} className="upcoming-group">
                  <div className="upcoming-date">{date}</div>
                  {items.map((e) => (
                    <div key={e.id} className={`event-item ${deletingEventId === e.id ? 'deleting' : ''}`}
                      onClick={() => openEventDetail(e)} role="button" tabIndex={0}
                      onKeyDown={(ev) => ev.key === 'Enter' && openEventDetail(e)}>
                      <div className="event-item-info">
                        <span className="event-item-title">{e.title}</span>
                        <span className="event-item-meta">{formatEventRange(e)}</span>
                      </div>
                      {canEditEvent(e) && (
                        <button className="event-item-delete" onClick={(ev) => { ev.stopPropagation(); handleDeleteEventWithAnimation(e.id) }} aria-label="삭제">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </section>
        )}
      </aside>

      <EditTaskModal
        task={editingTask}
        currentUserId={state.currentUser?.id}
        users={state.users}
        assigneeId={editTaskAssigneeId}
        priority={editTaskPriority}
        onAssigneeChange={setEditTaskAssigneeId}
        onPriorityChange={setEditTaskPriority}
        onSave={handleUpdateTask}
        onClose={() => setEditingTask(null)}
        editInputRef={editInputRef}
      />

      <ContextMenuModal
        open={contextMenuModalOpen}
        onClose={() => { setContextMenuModalOpen(false); setPendingSelectRange(null) }}
        onAddMyTask={() => openAddTaskModal('my')}
        onAddTeamTask={() => openAddTaskModal('team')}
        onAddEvent={() => openAddEventModal()}
      />

      <AddTaskModal
        open={addTaskModalOpen}
        tabType={activeTab === 'schedule' ? 'my' : activeTab}
        title={newTaskTitle}
        time={newTaskTime}
        date={newTaskDate}
        priority={newTaskPriority}
        assigneeId={newTaskAssigneeId}
        users={state.users}
        inputRef={addTaskModalInputRef}
        onTitleChange={setNewTaskTitle}
        onTimeChange={setNewTaskTime}
        onDateChange={setNewTaskDate}
        onPriorityChange={setNewTaskPriority}
        onAssigneeChange={setNewTaskAssigneeId}
        onAdd={() => handleAddTask(true)}
        onClose={() => setAddTaskModalOpen(false)}
      />

      <AddEventModal
        open={addEventModalOpen}
        title={newEventTitle}
        startDate={newEventStartDate}
        startTime={newEventStartTime}
        endDate={newEventEndDate}
        endTime={newEventEndTime}
        inputRef={addEventModalInputRef}
        onTitleChange={setNewEventTitle}
        onStartDateChange={setNewEventStartDate}
        onStartTimeChange={setNewEventStartTime}
        onEndDateChange={setNewEventEndDate}
        onEndTimeChange={setNewEventEndTime}
        onAdd={() => handleAddEvent(true)}
        onClose={() => setAddEventModalOpen(false)}
      />

      <EventDetailModal
        event={selectedEvent}
        canEdit={selectedEvent ? canEditEvent(selectedEvent) : false}
        editMode={eventDetailEditMode}
        editForm={editEventForm}
        onEditFormChange={handleEventDetailFormChange}
        onEnterEditMode={() => setEventDetailEditMode(true)}
        onSave={handleUpdateEvent}
        onDelete={() => selectedEvent && handleDeleteEventWithAnimation(selectedEvent.id)}
        onClose={() => { setSelectedEvent(null); setEventDetailEditMode(false) }}
      />
    </div>
  )
}
