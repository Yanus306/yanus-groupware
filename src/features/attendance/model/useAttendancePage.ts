import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../auth/model'
import { useWorkSession } from './useWorkSession'
import {
  getAllWorkScheduleEvents,
  getAllWorkSchedules,
  getAttendanceByDate,
  getAttendanceByDates,
  getMyAttendance,
  getMyWorkSchedule,
  getTeamWorkScheduleEvents,
  getTeamWorkSchedules,
  getWorkScheduleEvents,
} from '../../../shared/api/attendanceApi'
import type {
  AttendanceRecord,
  MemberWorkScheduleItem,
  WorkScheduleEventItem,
} from '../../../shared/api/attendanceApi'
import { canViewManagedAttendance } from '../../../shared/lib/permissions'
import { formatDateRangeLabel, getDateStringsBetween, getTodayStr, getWeekRange } from '../../../shared/lib/date'
import { formatWorkScheduleForDate } from '../../../shared/lib/attendanceSchedule'

export type AttendanceFilter = 'today' | 'week' | 'custom'

interface AttendancePageState {
  activeRange: { start: string; end: string }
  activeDate: string
  canManageAttendance: boolean
  dateInput: string
  errorMessage: string | null
  filter: AttendanceFilter
  isLoading: boolean
  managedScheduleEvents: WorkScheduleEventItem[]
  managedSchedules: MemberWorkScheduleItem[]
  memberScheduleLabel: string
  myRecords: AttendanceRecord[]
  records: AttendanceRecord[]
  scheduleErrorMessage: string | null
  todayStr: string
  workSession: ReturnType<typeof useWorkSession>
  setDateInput: (value: string) => void
  handleDateFilter: () => void
  handleFilterChange: (nextFilter: AttendanceFilter) => void
  handleMemberClockClick: () => Promise<void>
  retry: () => void
}

function getTeamIdForName(
  teamName: string | undefined,
  teams: Array<{ id: number; name: string }> | undefined,
) {
  const matchedTeam = teams?.find((team) => team.name === teamName)
  if (matchedTeam) return matchedTeam.id

  const parsedTeamId = Number.parseInt(teamName ?? '', 10)
  return Number.isFinite(parsedTeamId) ? parsedTeamId : null
}

const SCHEDULE_LOAD_ERROR = '근무 일정 정보를 불러오지 못했습니다. 다시 시도해 주세요.'

export function useAttendancePage(): AttendancePageState {
  const { state } = useApp()
  const workSession = useWorkSession()
  const todayStr = getTodayStr()
  const currentUser = state.currentUser
  const canManageAttendance = canViewManagedAttendance(currentUser)
  const managedTeamId = currentUser?.role === 'TEAM_LEAD'
    ? getTeamIdForName(currentUser.team, state.teams)
    : null
  const requestIdRef = useRef(0)
  const [filter, setFilter] = useState<AttendanceFilter>('today')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([])
  const [memberScheduleLabel, setMemberScheduleLabel] = useState('일정 확인 중')
  const [managedSchedules, setManagedSchedules] = useState<MemberWorkScheduleItem[]>([])
  const [managedScheduleEvents, setManagedScheduleEvents] = useState<WorkScheduleEventItem[]>([])
  const [dateInput, setDateInput] = useState('')
  const [activeRange, setActiveRange] = useState(() => ({ start: todayStr, end: todayStr }))
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scheduleErrorMessage, setScheduleErrorMessage] = useState<string | null>(null)

  const filterManagedRecords = useCallback((nextRecords: AttendanceRecord[]) => {
    if (currentUser?.role !== 'TEAM_LEAD') return nextRecords

    const teamMemberIds = new Set(
      state.users
        .filter((user) => user.team === currentUser.team)
        .map((user) => Number(user.id)),
    )
    return nextRecords.filter((record) => teamMemberIds.has(record.memberId))
  }, [currentUser?.role, currentUser?.team, state.users])

  const loadManagedAttendance = useCallback(async (startDate: string, endDate = startDate) => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setErrorMessage(null)
    setScheduleErrorMessage(null)
    setActiveRange({ start: startDate, end: endDate })

    try {
      const dates = getDateStringsBetween(startDate, endDate)
      const scheduleRequest = currentUser?.role === 'TEAM_LEAD'
        ? managedTeamId
          ? getTeamWorkSchedules(managedTeamId)
          : Promise.resolve<MemberWorkScheduleItem[]>([])
        : getAllWorkSchedules()
      const scheduleEventRequest = currentUser?.role === 'TEAM_LEAD'
        ? managedTeamId
          ? getTeamWorkScheduleEvents(managedTeamId, startDate, endDate)
          : Promise.resolve<WorkScheduleEventItem[]>([])
        : getAllWorkScheduleEvents(startDate, endDate)
      const attendanceRequest = startDate === endDate
        ? getAttendanceByDate(startDate, managedTeamId)
        : getAttendanceByDates(dates, managedTeamId)
      const [attendanceResult, scheduleResult, scheduleEventResult] = await Promise.allSettled([
        attendanceRequest,
        scheduleRequest,
        scheduleEventRequest,
      ])

      if (requestId !== requestIdRef.current) return
      if (attendanceResult.status === 'rejected') throw attendanceResult.reason

      setRecords(filterManagedRecords(attendanceResult.value))
      setManagedSchedules(scheduleResult.status === 'fulfilled' ? scheduleResult.value : [])
      setManagedScheduleEvents(scheduleEventResult.status === 'fulfilled' ? scheduleEventResult.value : [])
      if (scheduleResult.status === 'rejected' || scheduleEventResult.status === 'rejected') {
        setScheduleErrorMessage(SCHEDULE_LOAD_ERROR)
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setErrorMessage(err instanceof Error ? err.message : '출석 데이터를 불러오지 못했습니다')
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [currentUser?.role, filterManagedRecords, managedTeamId])

  const loadMemberAttendance = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setErrorMessage(null)
    setScheduleErrorMessage(null)

    try {
      const [attendanceResult, scheduleResult, scheduleEventResult] = await Promise.allSettled([
        getMyAttendance(),
        getMyWorkSchedule(),
        getWorkScheduleEvents(todayStr, todayStr),
      ])

      if (requestId !== requestIdRef.current) return
      if (attendanceResult.status === 'rejected') throw attendanceResult.reason

      setMyRecords(attendanceResult.value)
      if (scheduleResult.status === 'fulfilled' && scheduleEventResult.status === 'fulfilled') {
        setMemberScheduleLabel(formatWorkScheduleForDate(scheduleResult.value, scheduleEventResult.value, todayStr))
      } else {
        setMemberScheduleLabel('일정 확인 불가')
        setScheduleErrorMessage(SCHEDULE_LOAD_ERROR)
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setErrorMessage(err instanceof Error ? err.message : '출석 데이터를 불러오지 못했습니다')
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    if (canManageAttendance) {
      void loadManagedAttendance(todayStr)
      return
    }
    void loadMemberAttendance()
  }, [canManageAttendance, loadManagedAttendance, loadMemberAttendance, todayStr])

  const handleDateFilter = () => {
    if (dateInput) void loadManagedAttendance(dateInput)
  }

  const handleFilterChange = (nextFilter: AttendanceFilter) => {
    setFilter(nextFilter)
    if (nextFilter === 'today') {
      void loadManagedAttendance(todayStr)
    } else if (nextFilter === 'week') {
      const week = getWeekRange(todayStr)
      void loadManagedAttendance(week.start, week.end)
    }
  }

  const handleMemberClockClick = async () => {
    await workSession.handleClockClick()
    await loadMemberAttendance()
  }

  const retry = () => {
    if (canManageAttendance) {
      void loadManagedAttendance(activeRange.start, activeRange.end)
    } else {
      workSession.clearError()
      void workSession.retry()
      void loadMemberAttendance()
    }
  }

  return {
    activeRange,
    activeDate: formatDateRangeLabel(activeRange.start, activeRange.end),
    canManageAttendance,
    dateInput,
    errorMessage,
    filter,
    isLoading,
    managedScheduleEvents,
    managedSchedules,
    memberScheduleLabel,
    myRecords,
    records,
    scheduleErrorMessage,
    todayStr,
    workSession,
    setDateInput,
    handleDateFilter,
    handleFilterChange,
    handleMemberClockClick,
    retry,
  }
}
