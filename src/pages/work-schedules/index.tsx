import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2, UserRound, Users } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventInput } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import { useApp } from '../../features/auth/model'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import {
  createWorkScheduleEvent,
  deleteWorkScheduleEvent,
  getAllWorkSchedules,
  getTeamWorkSchedules,
  getWorkScheduleEvents,
  updateWorkScheduleEvent,
  type MemberWorkScheduleItem,
  type WeekPattern,
  type WorkScheduleEventItem,
} from '../../shared/api/attendanceApi'
import { formatScheduleRangeLabel } from '../../shared/lib/attendanceSchedule'
import { formatTeamName, getTeamOptions, sortUsersByTeamAndName } from '../../shared/lib/team'
import { canViewAllWorkSchedules, canViewTeamWorkSchedules } from '../../shared/lib/permissions'
import { DataTableSection } from '../../shared/ui/DataTableSection'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Toast } from '../../shared/ui/Toast'
import { TimeInput } from '../../components/TimeInput'
import './work-schedules.css'

type CalendarScope = 'all' | 'team' | 'person'

interface CalendarRange {
  start: string
  end: string
}

interface CalendarRecurringEventMeta {
  kind: 'recurring'
  memberId: number
  memberName: string
  teamName: string
  date: string
  startTime: string
  endTime: string
  endsNextDay: boolean
  weekPattern: WeekPattern
}

interface CalendarDateEventMeta {
  kind: 'date-event'
  item: WorkScheduleEventItem
  isEditable: boolean
}

type WorkScheduleCalendarMeta = CalendarRecurringEventMeta | CalendarDateEventMeta

interface ScheduleModalState {
  mode: 'create' | 'edit' | 'detail'
  date: string
  startTime: string
  endTime: string
  endsNextDay: boolean
  item: WorkScheduleCalendarMeta | null
}

const DEFAULT_START_TIME = '09:00'
const DEFAULT_END_TIME = '18:00'
const WEEK_PATTERN_LABELS: Record<WeekPattern, string> = {
  EVERY: '매주',
  FIRST: '1주차',
  SECOND: '2주차',
  THIRD: '3주차',
  FOURTH: '4주차',
  LAST: '마지막 주',
}

const DAY_OF_WEEK_TO_INDEX = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
} as const

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toMondayIndex(jsDay: number) {
  return (jsDay + 6) % 7
}

function getOccurrencePattern(date: Date): Exclude<WeekPattern, 'EVERY' | 'LAST'> {
  const occurrence = Math.floor((date.getDate() - 1) / 7) + 1
  if (occurrence === 1) return 'FIRST'
  if (occurrence === 2) return 'SECOND'
  if (occurrence === 3) return 'THIRD'
  return 'FOURTH'
}

function isLastOccurrence(date: Date) {
  const nextWeek = new Date(date)
  nextWeek.setDate(date.getDate() + 7)
  return nextWeek.getMonth() !== date.getMonth()
}

function matchesWeekPattern(date: Date, pattern: WeekPattern | undefined) {
  const normalized = pattern ?? 'EVERY'
  if (normalized === 'EVERY') return true
  if (normalized === 'LAST') return isLastOccurrence(date)
  return getOccurrencePattern(date) === normalized
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatTimeLabel(time: string) {
  return time.slice(0, 5)
}

function getEventColors(kind: 'recurring' | 'date-event', isMine: boolean) {
  if (kind === 'date-event') {
    return isMine
      ? {
          backgroundColor: 'rgba(249, 115, 22, 0.16)',
          borderColor: 'rgba(249, 115, 22, 0.42)',
          textColor: 'var(--text-primary)',
        }
      : {
          backgroundColor: 'rgba(14, 165, 233, 0.16)',
          borderColor: 'rgba(14, 165, 233, 0.36)',
          textColor: 'var(--text-primary)',
        }
  }

  return isMine
    ? {
        backgroundColor: 'rgba(138, 114, 216, 0.18)',
        borderColor: 'rgba(138, 114, 216, 0.38)',
        textColor: 'var(--text-primary)',
      }
    : {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderColor: 'rgba(99, 102, 241, 0.28)',
        textColor: 'var(--text-primary)',
      }
}

function expandRecurringSchedules(
  schedules: MemberWorkScheduleItem[],
  range: CalendarRange | null,
  currentUserId: string,
): EventInput[] {
  if (!range) return []

  const start = new Date(`${range.start}T00:00:00`)
  const endExclusive = new Date(`${range.end}T00:00:00`)
  const events: EventInput[] = []

  for (const member of schedules) {
    for (let cursor = new Date(start); cursor < endExclusive; cursor = addDays(cursor, 1)) {
      const mondayIndex = toMondayIndex(cursor.getDay())
      const schedule = member.workSchedules.find(
        (item) => DAY_OF_WEEK_TO_INDEX[item.dayOfWeek] === mondayIndex && matchesWeekPattern(cursor, item.weekPattern),
      )

      if (!schedule) continue

      const isoDate = toIsoDate(cursor)
      const isMine = String(member.memberId) === currentUserId
      const colors = getEventColors('recurring', isMine)
      const startTime = formatTimeLabel(schedule.startTime)
      const endTime = formatTimeLabel(schedule.endTime)
      const endsNextDay = Boolean(schedule.endsNextDay)
      const endDate = endsNextDay ? toIsoDate(addDays(cursor, 1)) : isoDate

      events.push({
        id: `recurring-${member.memberId}-${schedule.dayOfWeek}-${schedule.weekPattern ?? 'EVERY'}-${isoDate}`,
        title: member.memberName,
        start: `${isoDate}T${schedule.startTime}`,
        end: `${endDate}T${schedule.endTime}`,
        allDay: false,
        editable: false,
        ...colors,
        extendedProps: {
          kind: 'recurring',
          memberId: member.memberId,
          memberName: member.memberName,
          teamName: member.teamName,
          date: isoDate,
          startTime,
          endTime,
          endsNextDay,
          weekPattern: schedule.weekPattern ?? 'EVERY',
        } satisfies CalendarRecurringEventMeta,
      })
    }
  }

  return events
}

function toDateEvents(items: WorkScheduleEventItem[], currentUserId: string): EventInput[] {
  return items.map((item) => {
    const isMine = String(item.memberId) === currentUserId
    const colors = getEventColors('date-event', isMine)
    const endDate = item.endsNextDay ? toIsoDate(addDays(new Date(`${item.date}T12:00:00`), 1)) : item.date
    return {
      id: `date-event-${item.id}`,
      title: item.memberName,
      start: `${item.date}T${item.startTime}`,
      end: `${endDate}T${item.endTime}`,
      allDay: false,
      editable: false,
      ...colors,
      extendedProps: {
        kind: 'date-event',
        item,
        isEditable: isMine,
      } satisfies CalendarDateEventMeta,
    }
  })
}

function getDefaultRange(): CalendarRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

export function WorkSchedules() {
  const { state, refreshMembers, refreshTeams } = useApp()
  const [scope, setScope] = useState<CalendarScope>('team')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [calendarRange, setCalendarRange] = useState<CalendarRange>(getDefaultRange)
  const [recurringSchedules, setRecurringSchedules] = useState<MemberWorkScheduleItem[]>([])
  const [dateEvents, setDateEvents] = useState<WorkScheduleEventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedCalendar, setHasLoadedCalendar] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modalState, setModalState] = useState<ScheduleModalState | null>(null)
  const [isModalSaving, setIsModalSaving] = useState(false)

  const currentUser = state.currentUser
  const canViewAll = canViewAllWorkSchedules(currentUser)
  const canViewTeam = canViewTeamWorkSchedules(currentUser)
  const currentUserId = currentUser?.id ?? ''
  const currentTeamName = currentUser?.team ?? ''

  const activeUsers = useMemo(
    () => sortUsersByTeamAndName(state.users.filter((member) => (member.status ?? 'ACTIVE') === 'ACTIVE')),
    [state.users],
  )
  const allTeams = useMemo(() => getTeamOptions(state.users, state.teams), [state.users, state.teams])
  const currentTeam = useMemo(
    () => allTeams.find((team) => team.name === currentTeamName) ?? null,
    [allTeams, currentTeamName],
  )
  const visibleTeams = useMemo(
    () => (canViewAll ? allTeams : currentTeam ? [currentTeam] : []),
    [allTeams, canViewAll, currentTeam],
  )
  const teamMembers = useMemo(
    () => activeUsers.filter((member) => member.team === currentTeamName),
    [activeUsers, currentTeamName],
  )
  const selectableMembers = useMemo(() => {
    if (canViewAll) return activeUsers
    if (canViewTeam) return teamMembers
    return currentUser ? activeUsers.filter((member) => member.id === currentUser.id) : []
  }, [activeUsers, canViewAll, canViewTeam, currentUser, teamMembers])

  useEffect(() => {
    if (state.teams.length === 0) {
      refreshTeams().catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : '팀 목록을 불러오지 못했습니다')
      })
    }

    if (state.users.length === 0) {
      refreshMembers().catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : '멤버 목록을 불러오지 못했습니다')
      })
    }
  }, [refreshMembers, refreshTeams, state.teams.length, state.users.length])

  useEffect(() => {
    setScope(canViewAll ? 'all' : 'team')
  }, [canViewAll, currentUserId])

  useEffect(() => {
    if (visibleTeams.length === 0) {
      setSelectedTeamId(null)
      return
    }

    if (selectedTeamId && visibleTeams.some((team) => team.id === selectedTeamId)) return
    setSelectedTeamId(currentTeam?.id ?? visibleTeams[0]?.id ?? null)
  }, [currentTeam, selectedTeamId, visibleTeams])

  useEffect(() => {
    if (selectableMembers.length === 0) {
      setSelectedMemberId('')
      return
    }

    if (selectedMemberId && selectableMembers.some((member) => member.id === selectedMemberId)) return
    setSelectedMemberId(currentUserId || selectableMembers[0]?.id || '')
  }, [currentUserId, selectableMembers, selectedMemberId])

  const selectedTeam = useMemo(
    () => visibleTeams.find((team) => team.id === selectedTeamId) ?? currentTeam ?? null,
    [currentTeam, selectedTeamId, visibleTeams],
  )

  const filteredDateEvents = useMemo(() => {
    if (scope === 'all' && canViewAll) return dateEvents
    if (scope === 'team') {
      const teamName = selectedTeam?.name ?? currentTeamName
      return dateEvents.filter((item) => item.teamName === teamName)
    }
    return dateEvents.filter((item) => String(item.memberId) === selectedMemberId)
  }, [canViewAll, currentTeamName, dateEvents, scope, selectedMemberId, selectedTeam])

  const loadCalendarData = useCallback(async () => {
    if (!currentUser) {
      setRecurringSchedules([])
      setDateEvents([])
      setIsLoading(false)
      setHasLoadedCalendar(true)
      return
    }

    setIsLoading(true)
    try {
      const [events, schedules] = await Promise.all([
        getWorkScheduleEvents(calendarRange.start, calendarRange.end),
        (async () => {
          if (scope === 'all' && canViewAll) {
            return getAllWorkSchedules()
          }

          const teamId =
            scope === 'team'
              ? (selectedTeam?.id ?? currentTeam?.id ?? null)
              : canViewAll
                ? null
                : (currentTeam?.id ?? null)

          if (scope === 'person' && canViewAll) {
            const all = await getAllWorkSchedules()
            return all.filter((item) => String(item.memberId) === selectedMemberId)
          }

          if (teamId) {
            const teamSchedules = await getTeamWorkSchedules(teamId)
            return scope === 'person'
              ? teamSchedules.filter((item) => String(item.memberId) === selectedMemberId)
              : teamSchedules
          }

          return []
        })(),
      ])

      setDateEvents(events)
      setRecurringSchedules(schedules)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '근무 일정 캘린더를 불러오지 못했습니다')
      setDateEvents([])
      setRecurringSchedules([])
    } finally {
      setIsLoading(false)
      setHasLoadedCalendar(true)
    }
  }, [calendarRange.end, calendarRange.start, canViewAll, currentTeam, currentUser, scope, selectedMemberId, selectedTeam])

  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  const calendarEvents = useMemo(
    () => [
      ...expandRecurringSchedules(recurringSchedules, calendarRange, currentUserId),
      ...toDateEvents(filteredDateEvents, currentUserId),
    ],
    [calendarRange, currentUserId, filteredDateEvents, recurringSchedules],
  )

  const openCreateModal = useCallback((date: string) => {
    setModalState({
      mode: 'create',
      date,
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
      endsNextDay: false,
      item: null,
    })
  }, [])

  const handleDateClick = useCallback((arg: DateClickArg) => {
    openCreateModal(arg.dateStr.slice(0, 10))
  }, [openCreateModal])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const meta = arg.event.extendedProps as WorkScheduleCalendarMeta | undefined
    if (!meta) return

    if (meta.kind === 'date-event') {
      setModalState({
        mode: meta.isEditable ? 'edit' : 'detail',
        date: meta.item.date,
        startTime: formatTimeLabel(meta.item.startTime),
        endTime: formatTimeLabel(meta.item.endTime),
        endsNextDay: Boolean(meta.item.endsNextDay),
        item: meta,
      })
      return
    }

    setModalState({
      mode: 'detail',
      date: meta.date,
      startTime: meta.startTime,
      endTime: meta.endTime,
      endsNextDay: meta.endsNextDay,
      item: meta,
    })
  }, [])

  const handleModalSubmit = async () => {
    if (!modalState || modalState.mode === 'detail') return

    setIsModalSaving(true)
    try {
      const payload = {
        date: modalState.date,
        startTime: `${modalState.startTime}:00`,
        endTime: `${modalState.endTime}:00`,
        endsNextDay: modalState.endsNextDay,
      }

      if (modalState.mode === 'create') {
        await createWorkScheduleEvent(payload)
      } else if (modalState.item?.kind === 'date-event') {
        await updateWorkScheduleEvent(modalState.item.item.id, payload)
      }

      setModalState(null)
      await loadCalendarData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '날짜별 근무 일정 저장에 실패했습니다')
    } finally {
      setIsModalSaving(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!modalState || modalState.mode !== 'edit' || modalState.item?.kind !== 'date-event') return

    setIsModalSaving(true)
    try {
      await deleteWorkScheduleEvent(modalState.item.item.id)
      setModalState(null)
      await loadCalendarData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '날짜별 근무 일정 삭제에 실패했습니다')
    } finally {
      setIsModalSaving(false)
    }
  }

  const modalTitle = useMemo(() => {
    if (!modalState) return ''
    if (modalState.mode === 'create') return '날짜별 근무 일정 추가'
    if (modalState.item?.kind === 'date-event') return '날짜별 근무 일정'
    return '근무 일정 상세'
  }, [modalState])

  return (
    <div className="work-schedules-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}

      <header className="work-schedules-header">
        <div className="work-schedules-copy">
          <p>반복 근무와 날짜별 근무 일정을 같은 캘린더에서 보고 바로 관리할 수 있습니다.</p>
        </div>
        <div className="work-schedules-summary glass">
          <CalendarDays size={16} />
          <span>날짜 클릭으로 개별 일정을 추가하고, 역할 범위에 따라 다른 사람 일정도 함께 확인합니다.</span>
        </div>
      </header>

      <div className="work-schedules-layout">
        <DataTableSection
          className="work-schedules-calendar-card"
          title="근무 일정 캘린더"
          description="날짜를 눌러 개인 근무 일정을 추가하고, 역할 범위에 따라 다른 사람 근무 일정도 함께 확인합니다."
        >
          <div className="work-schedules-toolbar">
            <div className="work-schedules-scope-group" role="group" aria-label="근무 일정 조회 범위">
              {canViewAll && (
                <button
                  type="button"
                  className={`scope-chip ${scope === 'all' ? 'active' : ''}`}
                  onClick={() => setScope('all')}
                >
                  <Users size={14} />
                  전체
                </button>
              )}
              {canViewTeam && (
                <button
                  type="button"
                  className={`scope-chip ${scope === 'team' ? 'active' : ''}`}
                  onClick={() => setScope('team')}
                >
                  <CalendarDays size={14} />
                  {canViewAll ? '팀별' : '우리 팀'}
                </button>
              )}
              <button
                type="button"
                className={`scope-chip ${scope === 'person' ? 'active' : ''}`}
                onClick={() => setScope('person')}
              >
                <UserRound size={14} />
                개인
              </button>
            </div>

            <div className="work-schedules-selectors">
              {scope === 'team' && canViewAll && visibleTeams.length > 0 && (
                <label className="work-schedules-select">
                  <span>조회 팀</span>
                  <select
                    value={selectedTeamId ?? ''}
                    onChange={(event) => setSelectedTeamId(Number(event.target.value))}
                  >
                    {visibleTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {formatTeamName(team.name)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {scope === 'person' && selectableMembers.length > 0 && (
                <label className="work-schedules-select">
                  <span>조회 멤버</span>
                  <select
                    value={selectedMemberId}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                  >
                    {selectableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {formatTeamName(member.team)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="work-schedules-calendar-meta">
            <div className="work-schedules-legend">
              <span className="legend-chip recurring-own">내 반복 일정</span>
              <span className="legend-chip recurring-team">공유 반복 일정</span>
              <span className="legend-chip date-own">날짜별 추가 일정</span>
              <span className="legend-chip date-team">팀 공유 일정</span>
            </div>
            <button
              type="button"
              className="quick-add-btn"
              onClick={() => openCreateModal(toIsoDate(new Date()))}
            >
              <Plus size={16} />
              날짜별 일정 추가
            </button>
          </div>

          {isLoading && !hasLoadedCalendar ? (
            <div className="work-schedules-loading">근무 일정을 불러오는 중...</div>
          ) : (
            <div className="work-schedules-calendar-shell">
              {isLoading && hasLoadedCalendar && (
                <div className="work-schedules-calendar-overlay">근무 일정을 새로 불러오는 중...</div>
              )}
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                locale={koLocale}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,listMonth',
                }}
                buttonText={{
                  today: '오늘',
                  month: '월',
                  listMonth: '목록',
                }}
                height="auto"
                events={calendarEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                datesSet={(arg) => {
                  setCalendarRange({
                    start: toIsoDate(arg.start),
                    end: toIsoDate(arg.end),
                  })
                }}
                dayMaxEventRows={3}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              />
              {!isLoading && calendarEvents.length === 0 && (
                <div className="work-schedules-empty-state">
                  <EmptyState
                    title="표시할 근무 일정이 없습니다."
                    description="반복 근무를 저장하거나 날짜를 눌러 개별 근무 일정을 추가해 주세요."
                  />
                </div>
              )}
            </div>
          )}
        </DataTableSection>

        <div className="work-schedules-side">
          <DataTableSection
            className="work-schedules-editor-card"
            title="반복 근무 설정"
            description="요일별 반복 근무만 빠르게 수정합니다. 날짜별 일정 조회와 예외 추가는 왼쪽 캘린더에서 처리합니다."
          >
            <SetWorkDaysPersonal hideHeader onSaved={loadCalendarData} />
          </DataTableSection>
        </div>
      </div>

      {modalState && (
        <div className="work-schedules-modal-overlay" onClick={() => setModalState(null)}>
          <div className="work-schedules-modal glass" onClick={(event) => event.stopPropagation()}>
            <div className="work-schedules-modal-header">
              <div>
                <h3>{modalTitle}</h3>
                <p>{modalState.date}</p>
              </div>
              <button type="button" className="work-schedules-modal-close" onClick={() => setModalState(null)}>
                닫기
              </button>
            </div>

            {modalState.mode === 'detail' && modalState.item?.kind === 'recurring' && (
              <div className="work-schedules-detail-list">
                <div className="work-schedules-detail-item">
                  <strong>멤버</strong>
                  <span>{modalState.item.memberName}</span>
                </div>
                <div className="work-schedules-detail-item">
                  <strong>팀</strong>
                  <span>{formatTeamName(modalState.item.teamName)}</span>
                </div>
                <div className="work-schedules-detail-item">
                  <strong>시간</strong>
                  <span>
                    {formatScheduleRangeLabel({
                      startTime: modalState.startTime,
                      endTime: modalState.endTime,
                      endsNextDay: modalState.endsNextDay,
                    })}
                  </span>
                </div>
                <div className="work-schedules-detail-item">
                  <strong>반복 주차</strong>
                  <span>{WEEK_PATTERN_LABELS[modalState.item.weekPattern]}</span>
                </div>
              </div>
            )}

            {modalState.mode === 'detail' && modalState.item?.kind === 'date-event' && (
              <div className="work-schedules-detail-list">
                <div className="work-schedules-detail-item">
                  <strong>멤버</strong>
                  <span>{modalState.item.item.memberName}</span>
                </div>
                <div className="work-schedules-detail-item">
                  <strong>팀</strong>
                  <span>{formatTeamName(modalState.item.item.teamName)}</span>
                </div>
                <div className="work-schedules-detail-item">
                  <strong>시간</strong>
                  <span>
                    {formatScheduleRangeLabel({
                      startTime: modalState.startTime,
                      endTime: modalState.endTime,
                      endsNextDay: modalState.endsNextDay,
                    })}
                  </span>
                </div>
              </div>
            )}

            {modalState.mode !== 'detail' && (
              <>
                <div className="work-schedules-modal-form">
                  <label className="work-schedules-modal-field">
                    <span>날짜</span>
                    <input
                      type="date"
                      value={modalState.date}
                      onChange={(event) =>
                        setModalState((prev) => (prev ? { ...prev, date: event.target.value } : prev))
                      }
                    />
                  </label>
                  <label className="work-schedules-modal-field">
                    <span>출근 시간</span>
                    <TimeInput
                      value={modalState.startTime}
                      onChange={(value) =>
                        setModalState((prev) => (prev ? { ...prev, startTime: value } : prev))
                      }
                    />
                  </label>
                  <label className="work-schedules-modal-field">
                    <span>퇴근 시간</span>
                    <TimeInput
                      value={modalState.endTime}
                      onChange={(value) =>
                        setModalState((prev) => (prev ? { ...prev, endTime: value } : prev))
                      }
                    />
                  </label>
                  <label className="work-schedules-modal-toggle">
                    <span>
                      <strong>다음날 종료</strong>
                      <small>
                        야간 근무처럼 자정을 넘기는 일정이면 켜 주세요.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={modalState.endsNextDay}
                      onChange={(event) =>
                        setModalState((prev) => (prev ? { ...prev, endsNextDay: event.target.checked } : prev))
                      }
                    />
                  </label>
                </div>

                <div className="work-schedules-modal-actions">
                  {modalState.mode === 'edit' && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={handleDeleteEvent}
                      disabled={isModalSaving}
                    >
                      <Trash2 size={16} />
                      삭제
                    </button>
                  )}
                  <button type="button" className="secondary-btn" onClick={() => setModalState(null)}>
                    취소
                  </button>
                  <button type="button" className="primary-btn" onClick={handleModalSubmit} disabled={isModalSaving}>
                    <Pencil size={16} />
                    {isModalSaving ? '저장 중...' : modalState.mode === 'create' ? '추가' : '수정'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
