import { http, HttpResponse } from 'msw'
import type { Leave } from '../../../../entities/leave/model/types'
import type { AuditLog } from '../../../api/auditLogsApi'
import type {
  AttendanceException,
  AttendanceExceptionListResponse,
  AttendanceExceptionStatus,
  AttendanceExceptionSummary,
  AttendanceExceptionType,
} from '../../../api/attendanceExceptionsApi'
import type { AttendanceSettlement } from '../../../api/attendanceSettlementApi'
import { getAuthMockUserByAuthorization } from './auth'

type MockTaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

interface MockTask {
  id: number
  title: string
  date: string
  time: string
  priority: MockTaskPriority
  done: boolean
  isTeamTask: boolean
  assigneeId: number | null
  assigneeName: string | null
  memberIds?: number[] | null
  memberNames?: string[] | null
}

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString().slice(0, 10)

let nextTaskId = 5
let nextLeaveId = 4
let autoCheckoutTime = '23:59:59'

let mockTasks: MockTask[] = [
  {
    id: 1,
    title: '주간 회의 안건 정리',
    date: today,
    time: '10:00:00',
    priority: 'HIGH',
    done: false,
    isTeamTask: false,
    assigneeId: 1,
    assigneeName: '김리더',
  },
  {
    id: 2,
    title: '출퇴근 누락자 확인',
    date: today,
    time: '18:30:00',
    priority: 'MEDIUM',
    done: false,
    isTeamTask: true,
    assigneeId: 1,
    assigneeName: '김리더',
    memberIds: [1, 2],
    memberNames: ['김리더', '박팀장'],
  },
  {
    id: 3,
    title: '신입 팀 공지 업로드',
    date: tomorrow,
    time: '14:00:00',
    priority: 'LOW',
    done: false,
    isTeamTask: true,
    assigneeId: 2,
    assigneeName: '박팀장',
    memberIds: [2, 3],
    memberNames: ['박팀장', '이멤버'],
  },
  {
    id: 4,
    title: '정산 시트 점검',
    date: today,
    time: '20:00:00',
    priority: 'HIGH',
    done: true,
    isTeamTask: false,
    assigneeId: 1,
    assigneeName: '김리더',
  },
]

let mockLeaves: Leave[] = [
  {
    id: 1,
    memberId: 1,
    memberName: '김리더',
    category: 'PERSONAL',
    detail: '병원 진료',
    date: today,
    status: 'PENDING',
    submittedAt: `${today}T09:10:00`,
    reviewedAt: null,
  },
  {
    id: 2,
    memberId: 2,
    memberName: '박팀장',
    category: 'VACATION',
    detail: '가족 일정',
    date: tomorrow,
    status: 'APPROVED',
    submittedAt: `${today}T08:30:00`,
    reviewedAt: `${today}T11:00:00`,
  },
  {
    id: 3,
    memberId: 3,
    memberName: '이멤버',
    category: 'SICK_LEAVE',
    detail: '감기',
    date: tomorrow,
    status: 'REJECTED',
    submittedAt: `${today}T07:45:00`,
    reviewedAt: `${today}T10:20:00`,
  },
]

const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    actorId: 1,
    actorRole: 'ADMIN',
    targetId: 2,
    action: 'ROLE_CHANGE',
    previousValue: 'MEMBER',
    newValue: 'TEAM_LEAD',
    createdAt: `${today}T10:15:00`,
  },
  {
    id: 2,
    actorId: 1,
    actorRole: 'ADMIN',
    targetId: 3,
    action: 'TEAM_CHANGE',
    previousValue: '신입',
    newValue: '3팀',
    createdAt: `${today}T14:25:00`,
  },
  {
    id: 3,
    actorId: 1,
    actorRole: 'ADMIN',
    targetId: 5,
    action: 'ACTIVATE',
    previousValue: 'INACTIVE',
    newValue: 'ACTIVE',
    createdAt: `${today}T18:05:00`,
  },
]

let mockAttendanceExceptions: AttendanceException[] = [
  {
    id: 1,
    memberId: 2,
    memberName: '박팀장',
    teamName: '2팀',
    workDate: today,
    type: 'MISSED_CHECK_OUT',
    status: 'OPEN',
    note: '스터디룸 정리 후 퇴근 버튼을 누르지 못했습니다.',
    reason: '행사 마감 후 정리하다가 퇴근 누락',
    approvedBy: null,
    approvedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    attendanceRecordId: 201,
    scheduledStartTime: '09:00:00',
    scheduledEndTime: '18:00:00',
    checkInTime: `${today}T09:02:00`,
    checkOutTime: null,
  },
  {
    id: 2,
    memberId: 3,
    memberName: '이멤버',
    teamName: '3팀',
    workDate: today,
    type: 'LATE',
    status: 'OPEN',
    note: '교통 지연 사유 확인 필요',
    reason: '지하철 지연',
    approvedBy: null,
    approvedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    attendanceRecordId: 202,
    scheduledStartTime: '09:00:00',
    scheduledEndTime: '18:00:00',
    checkInTime: `${today}T09:14:00`,
    checkOutTime: `${today}T18:05:00`,
  },
  {
    id: 3,
    memberId: 4,
    memberName: '최개발',
    teamName: '1팀',
    workDate: today,
    type: 'NO_SCHEDULE',
    status: 'APPROVED',
    note: '행사 준비용 임시 근무로 승인',
    reason: '신입 OT 준비 지원',
    approvedBy: '관리자',
    approvedAt: `${today}T11:20:00`,
    resolvedBy: null,
    resolvedAt: null,
    attendanceRecordId: 203,
    scheduledStartTime: null,
    scheduledEndTime: null,
    checkInTime: `${today}T10:01:00`,
    checkOutTime: `${today}T16:42:00`,
  },
  {
    id: 4,
    memberId: 5,
    memberName: '정보안',
    teamName: '4팀',
    workDate: today,
    type: 'MISSED_CHECK_IN',
    status: 'OPEN',
    note: '',
    reason: '출근 체크를 놓쳤다고 구두 전달',
    approvedBy: null,
    approvedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    attendanceRecordId: null,
    scheduledStartTime: '13:00:00',
    scheduledEndTime: '18:00:00',
    checkInTime: null,
    checkOutTime: null,
  },
]

function getUserName(userId: number) {
  if (userId === 1) return '김리더'
  if (userId === 2) return '박팀장'
  if (userId === 3) return '이멤버'
  if (userId === 4) return '최개발'
  return '정보안'
}

function getTeamName(userId: number) {
  if (userId === 1 || userId === 4) return '1팀'
  if (userId === 2) return '2팀'
  if (userId === 3) return '3팀'
  return '4팀'
}

function createSettlement(yearMonth: string, memberId: number): AttendanceSettlement {
  const memberName = getUserName(memberId)
  const teamName = getTeamName(memberId)
  const baseDay = String((memberId % 4) + 1).padStart(2, '0')

  return {
    yearMonth,
    memberId,
    memberName,
    teamName,
    scheduledDays: 12,
    attendedDays: 11,
    lateDays: 2,
    totalLateMinutes: 13,
    lateFee: 1300,
    items: [
      {
        date: `${yearMonth}-${baseDay}`,
        scheduledStartTime: '09:00:00',
        scheduledEndTime: '18:00:00',
        checkInTime: `${yearMonth}-${baseDay}T09:05:00`,
        checkOutTime: `${yearMonth}-${baseDay}T18:02:00`,
        lateMinutes: 5,
        fee: 500,
        status: 'LATE',
      },
      {
        date: `${yearMonth}-${String(Number(baseDay) + 3).padStart(2, '0')}`,
        scheduledStartTime: '09:00:00',
        scheduledEndTime: '18:00:00',
        checkInTime: `${yearMonth}-${String(Number(baseDay) + 3).padStart(2, '0')}T09:08:00`,
        checkOutTime: `${yearMonth}-${String(Number(baseDay) + 3).padStart(2, '0')}T18:01:00`,
        lateMinutes: 8,
        fee: 800,
        status: 'LATE',
      },
      {
        date: `${yearMonth}-${String(Number(baseDay) + 6).padStart(2, '0')}`,
        scheduledStartTime: '09:00:00',
        scheduledEndTime: '18:00:00',
        checkInTime: `${yearMonth}-${String(Number(baseDay) + 6).padStart(2, '0')}T08:59:00`,
        checkOutTime: `${yearMonth}-${String(Number(baseDay) + 6).padStart(2, '0')}T18:03:00`,
        lateMinutes: 0,
        fee: 0,
        status: 'ON_TIME',
      },
    ],
  }
}

function getCurrentUserId(authorization: string | null) {
  return Number(getAuthMockUserByAuthorization(authorization).id)
}

function filterTasksByRange(tasks: MockTask[], startDate: string | null, endDate: string | null) {
  return tasks.filter((task) => {
    if (startDate && task.date < startDate) return false
    if (endDate && task.date > endDate) return false
    return true
  })
}

function matchesAttendanceExceptionType(type: AttendanceExceptionType | null, targetType: AttendanceExceptionType) {
  return !type || type === targetType
}

function matchesAttendanceExceptionStatus(status: AttendanceExceptionStatus | null, targetStatus: AttendanceExceptionStatus) {
  return !status || status === targetStatus
}

function buildAttendanceExceptionSummary(items: AttendanceException[], filteredCount: number): AttendanceExceptionSummary {
  return items.reduce<AttendanceExceptionSummary>(
    (summary, item) => ({
      totalCount: summary.totalCount + 1,
      filteredCount,
      openCount: summary.openCount + (item.status === 'OPEN' ? 1 : 0),
      missedCheckInCount: summary.missedCheckInCount + (item.type === 'MISSED_CHECK_IN' ? 1 : 0),
      missedCheckOutCount: summary.missedCheckOutCount + (item.type === 'MISSED_CHECK_OUT' ? 1 : 0),
      lateCount: summary.lateCount + (item.type === 'LATE' ? 1 : 0),
      noScheduleCount: summary.noScheduleCount + (item.type === 'NO_SCHEDULE' ? 1 : 0),
    }),
    {
      totalCount: 0,
      filteredCount,
      openCount: 0,
      missedCheckInCount: 0,
      missedCheckOutCount: 0,
      lateCount: 0,
      noScheduleCount: 0,
    },
  )
}

function filterAttendanceExceptions({
  date,
  type,
  status,
  teamName,
}: {
  date: string
  type: AttendanceExceptionType | null
  status: AttendanceExceptionStatus | null
  teamName: string | null
}) {
  const baseItems = mockAttendanceExceptions.filter((item) => item.workDate === date)

  return {
    baseItems,
    filteredItems: baseItems.filter((item) => {
      if (!matchesAttendanceExceptionType(type, item.type)) return false
      if (!matchesAttendanceExceptionStatus(status, item.status)) return false
      if (teamName && item.teamName !== teamName) return false
      return true
    }),
  }
}

function updateAttendanceException(
  exceptionId: number,
  updater: (current: AttendanceException) => AttendanceException,
) {
  let updated: AttendanceException | null = null

  mockAttendanceExceptions = mockAttendanceExceptions.map((item) => {
    if (item.id !== exceptionId) return item
    updated = updater(item)
    return updated
  })

  return updated
}

export const operationsHandlers = [
  http.get('/api/v1/tasks', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const currentUserId = getCurrentUserId(request.headers.get('Authorization'))

    let tasks = filterTasksByRange(mockTasks, startDate, endDate)
    if (type === 'MY') {
      tasks = tasks.filter((task) => !task.isTeamTask && task.assigneeId === currentUserId)
    } else if (type === 'TEAM') {
      tasks = tasks.filter((task) => task.isTeamTask)
    }

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: tasks })
  }),

  http.post('/api/v1/tasks', async ({ request }) => {
    const body = await request.json() as Omit<MockTask, 'id' | 'done' | 'assigneeName' | 'memberNames'>
    const currentUserId = getCurrentUserId(request.headers.get('Authorization'))
    const newTask: MockTask = {
      id: nextTaskId++,
      title: body.title,
      date: body.date,
      time: body.time,
      priority: body.priority,
      done: false,
      isTeamTask: body.isTeamTask,
      assigneeId: body.assigneeId ?? currentUserId,
      assigneeName: getUserName(body.assigneeId ?? currentUserId),
      memberIds: body.memberIds ?? null,
      memberNames: body.memberIds?.map(getUserName) ?? null,
    }

    mockTasks = [...mockTasks, newTask]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: newTask }, { status: 201 })
  }),

  http.put('/api/v1/tasks/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as Partial<MockTask>
    let updatedTask: MockTask | undefined

    mockTasks = mockTasks.map((task) => {
      if (task.id !== id) return task
      updatedTask = {
        ...task,
        ...body,
        memberNames: body.memberIds ? body.memberIds.map(getUserName) : task.memberNames,
      }
      return updatedTask
    })

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updatedTask })
  }),

  http.patch('/api/v1/tasks/:id/done', ({ params }) => {
    const id = Number(params.id)
    let updatedTask: MockTask | undefined

    mockTasks = mockTasks.map((task) => {
      if (task.id !== id) return task
      updatedTask = { ...task, done: !task.done }
      return updatedTask
    })

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updatedTask })
  }),

  http.delete('/api/v1/tasks/:id', ({ params }) => {
    const id = Number(params.id)
    mockTasks = mockTasks.filter((task) => task.id !== id)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),

  http.get('/api/v1/leaves', ({ request }) => {
    const currentUserId = getCurrentUserId(request.headers.get('Authorization'))
    const leaves = mockLeaves.filter((leave) => leave.memberId === currentUserId)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: leaves })
  }),

  http.post('/api/v1/leaves', async ({ request }) => {
    const body = await request.json() as { category: Leave['category']; detail: string; date: string }
    const currentUser = getAuthMockUserByAuthorization(request.headers.get('Authorization'))
    const newLeave: Leave = {
      id: nextLeaveId++,
      memberId: Number(currentUser.id),
      memberName: currentUser.name,
      category: body.category,
      detail: body.detail,
      date: body.date,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    }

    mockLeaves = [newLeave, ...mockLeaves]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: newLeave }, { status: 201 })
  }),

  http.get('/api/v1/leaves/admin', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockLeaves }),
  ),

  http.patch('/api/v1/leaves/:id/approve', ({ params }) => {
    const id = Number(params.id)
    let updatedLeave: Leave | undefined

    mockLeaves = mockLeaves.map((leave) => {
      if (leave.id !== id) return leave
      updatedLeave = { ...leave, status: 'APPROVED', reviewedAt: new Date().toISOString() }
      return updatedLeave
    })

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updatedLeave })
  }),

  http.patch('/api/v1/leaves/:id/reject', ({ params }) => {
    const id = Number(params.id)
    let updatedLeave: Leave | undefined

    mockLeaves = mockLeaves.map((leave) => {
      if (leave.id !== id) return leave
      updatedLeave = { ...leave, status: 'REJECTED', reviewedAt: new Date().toISOString() }
      return updatedLeave
    })

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updatedLeave })
  }),

  http.get('/api/v1/settings/auto-checkout-time', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { autoCheckoutTime },
    }),
  ),

  http.patch('/api/v1/settings/auto-checkout-time', async ({ request }) => {
    const body = await request.json() as { autoCheckoutTime: string }
    autoCheckoutTime = body.autoCheckoutTime
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { autoCheckoutTime },
    })
  }),

  http.get('/api/v1/attendance-exceptions', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') ?? today
    const type = url.searchParams.get('type') as AttendanceExceptionType | null
    const status = url.searchParams.get('status') as AttendanceExceptionStatus | null
    const teamName = url.searchParams.get('teamName')

    const { baseItems, filteredItems } = filterAttendanceExceptions({ date, type, status, teamName })
    const response: AttendanceExceptionListResponse = {
      date,
      summary: buildAttendanceExceptionSummary(baseItems, filteredItems.length),
      items: filteredItems,
    }

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: response })
  }),

  http.patch('/api/v1/attendance-exceptions/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as { note?: string; reason?: string }
    const updated = updateAttendanceException(id, (item) => ({
      ...item,
      note: body.note ?? item.note,
      reason: body.reason ?? item.reason,
    }))

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.post('/api/v1/attendance-exceptions/:id/approve', async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as { note?: string }
    const updated = updateAttendanceException(id, (item) => ({
      ...item,
      status: 'APPROVED',
      note: body.note ?? item.note,
      approvedBy: '관리자',
      approvedAt: new Date().toISOString(),
    }))

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.post('/api/v1/attendance-exceptions/:id/reject', async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as { note?: string }
    const updated = updateAttendanceException(id, (item) => ({
      ...item,
      status: 'REJECTED',
      note: body.note ?? item.note,
    }))

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.post('/api/v1/attendance-exceptions/:id/resolve', async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json() as { note?: string }
    const updated = updateAttendanceException(id, (item) => ({
      ...item,
      status: 'RESOLVED',
      note: body.note ?? item.note,
      resolvedBy: '관리자',
      resolvedAt: new Date().toISOString(),
    }))

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),

  http.post('/api/v1/attendance-exceptions/bulk-auto-checkout', async ({ request }) => {
    const body = await request.json() as { date: string; memberIds?: number[] }
    const targetDate = body.date ?? today
    const targetMemberIds = new Set(body.memberIds ?? [])
    const shouldFilterMembers = targetMemberIds.size > 0
    const updatedIds: number[] = []

    mockAttendanceExceptions = mockAttendanceExceptions.map((item) => {
      if (item.workDate !== targetDate || item.type !== 'MISSED_CHECK_OUT') return item
      if (shouldFilterMembers && !targetMemberIds.has(item.memberId)) return item

      updatedIds.push(item.id)
      return {
        ...item,
        status: 'RESOLVED',
        note: item.note || `자동 체크아웃 기준 ${autoCheckoutTime}로 일괄 처리`,
        checkOutTime: `${targetDate}T${autoCheckoutTime}`,
        resolvedBy: '관리자',
        resolvedAt: new Date().toISOString(),
      }
    })

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        processedCount: updatedIds.length,
        updatedIds,
      },
    })
  }),

  http.get('/api/v1/attendance-settlements/monthly', ({ request }) => {
    const url = new URL(request.url)
    const yearMonth = url.searchParams.get('yearMonth') ?? today.slice(0, 7)
    const targetMemberId = url.searchParams.get('targetMemberId')
    const memberId = targetMemberId
      ? Number(targetMemberId)
      : getCurrentUserId(request.headers.get('Authorization'))

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: createSettlement(yearMonth, memberId),
    })
  }),

  http.get('/api/v1/audit-logs', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockAuditLogs }),
  ),
]
