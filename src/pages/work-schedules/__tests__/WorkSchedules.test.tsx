import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockGetAllWorkSchedules = vi.fn()
const mockGetTeamWorkSchedules = vi.fn()
const mockGetWorkScheduleEvents = vi.fn()
const mockCreateWorkScheduleEvent = vi.fn()
let capturedEvents: Array<Record<string, unknown>> = []

let mockState = {
  currentUser: { id: '1', name: '관리자', role: 'ADMIN', team: '1팀' },
  users: [
    { id: '1', name: '관리자', role: 'ADMIN', team: '1팀', email: 'admin@yanus.kr', status: 'ACTIVE' },
    { id: '2', name: '팀원', role: 'MEMBER', team: '1팀', email: 'member@yanus.kr', status: 'ACTIVE' },
  ],
  teams: [
    { id: 1, name: '1팀' },
    { id: 2, name: '2팀' },
  ],
}

vi.mock('@fullcalendar/react', () => ({
  default: (props: { events?: unknown[]; dateClick?: (arg: { dateStr: string }) => void }) => (
    (() => {
      capturedEvents = (props.events as Array<Record<string, unknown>> | undefined) ?? []
      return (
        <div data-testid="mock-calendar">
          <button type="button" onClick={() => props.dateClick?.({ dateStr: '2026-03-30' })}>
            날짜 클릭
          </button>
          <span>events:{props.events?.length ?? 0}</span>
        </div>
      )
    })()
  ),
}))

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: mockState,
    refreshMembers: vi.fn(async () => []),
    refreshTeams: vi.fn(async () => []),
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  SetWorkDaysPersonal: () => <div data-testid="recurring-editor">반복 근무 편집기</div>,
}))

vi.mock('../../../shared/api/attendanceApi', () => ({
  getAllWorkSchedules: (...args: unknown[]) => mockGetAllWorkSchedules(...args),
  getTeamWorkSchedules: (...args: unknown[]) => mockGetTeamWorkSchedules(...args),
  getWorkScheduleEvents: (...args: unknown[]) => mockGetWorkScheduleEvents(...args),
  createWorkScheduleEvent: (...args: unknown[]) => mockCreateWorkScheduleEvent(...args),
  updateWorkScheduleEvent: vi.fn(),
  deleteWorkScheduleEvent: vi.fn(),
}))

import { WorkSchedules } from '../index'

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + days)
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, '0')
  const day = String(next.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('WorkSchedules 페이지', () => {
  beforeEach(() => {
    mockState = {
      currentUser: { id: '1', name: '관리자', role: 'ADMIN', team: '1팀' },
      users: [
        { id: '1', name: '관리자', role: 'ADMIN', team: '1팀', email: 'admin@yanus.kr', status: 'ACTIVE' },
        { id: '2', name: '팀원', role: 'MEMBER', team: '1팀', email: 'member@yanus.kr', status: 'ACTIVE' },
      ],
      teams: [
        { id: 1, name: '1팀' },
        { id: 2, name: '2팀' },
      ],
    }
    mockGetAllWorkSchedules.mockResolvedValue([
      {
        memberId: 1,
        memberName: '관리자',
        teamName: '1팀',
        workSchedules: [{ id: 1, dayOfWeek: 'MONDAY', startTime: '22:00:00', endTime: '06:00:00', weekPattern: 'EVERY', endsNextDay: true }],
      },
    ])
    mockGetTeamWorkSchedules.mockResolvedValue([
      {
        memberId: 2,
        memberName: '팀원',
        teamName: '1팀',
        workSchedules: [{ id: 2, dayOfWeek: 'TUESDAY', startTime: '10:00:00', endTime: '19:00:00', weekPattern: 'EVERY' }],
      },
    ])
    mockGetWorkScheduleEvents.mockResolvedValue([
      {
        id: 101,
        date: '2026-03-30',
        startTime: '13:00:00',
        endTime: '18:00:00',
        endsNextDay: false,
        memberId: 2,
        memberName: '팀원',
        teamName: '1팀',
      },
    ])
    mockCreateWorkScheduleEvent.mockResolvedValue({
      id: 999,
      date: '2026-03-30',
      startTime: '09:00:00',
      endTime: '18:00:00',
      endsNextDay: false,
      memberId: 1,
      memberName: '관리자',
      teamName: '1팀',
    })
  })

  it('관리자는 전체, 팀별, 개인 필터와 캘린더를 본다', async () => {
    render(<WorkSchedules />)

    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '팀별' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '개인' })).toBeInTheDocument()
    expect(screen.getByTestId('recurring-editor')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockGetAllWorkSchedules).toHaveBeenCalled()
      expect(mockGetWorkScheduleEvents).toHaveBeenCalled()
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument()
    })

    expect(
      capturedEvents.some((event) => {
        const start = String(event.start ?? '')
        const end = String(event.end ?? '')
        return start.includes('T22:00:00') && end.slice(0, 10) > start.slice(0, 10)
      }),
    ).toBe(true)
  })

  it('일반 멤버는 우리 팀과 개인 필터만 본다', async () => {
    mockState = {
      currentUser: { id: '2', name: '팀원', role: 'MEMBER', team: '1팀' },
      users: [
        { id: '1', name: '관리자', role: 'ADMIN', team: '1팀', email: 'admin@yanus.kr', status: 'ACTIVE' },
        { id: '2', name: '팀원', role: 'MEMBER', team: '1팀', email: 'member@yanus.kr', status: 'ACTIVE' },
      ],
      teams: [{ id: 1, name: '1팀' }],
    }

    render(<WorkSchedules />)

    expect(screen.queryByRole('button', { name: '전체' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '우리 팀' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '개인' })).toBeInTheDocument()

    await waitFor(() => {
      expect(mockGetTeamWorkSchedules).toHaveBeenCalled()
    })
  })

  it('빠른 추가 버튼을 누르면 날짜별 근무 일정 추가 모달이 열린다', async () => {
    render(<WorkSchedules />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '날짜별 일정 추가' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '날짜별 일정 추가' }))

    await waitFor(() => {
      expect(screen.getByText('날짜별 근무 일정 추가')).toBeInTheDocument()
      expect(screen.getByLabelText('시작 날짜')).toBeInTheDocument()
      expect(screen.getByLabelText('종료 날짜')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })
  })

  it('다음날 종료를 켜면 종료 날짜가 다음날로 바뀌고 끄면 같은 날로 돌아온다', async () => {
    render(<WorkSchedules />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '날짜별 일정 추가' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '날짜별 일정 추가' }))

    const startDateInput = await screen.findByLabelText('시작 날짜')
    const endDateInput = screen.getByLabelText('종료 날짜')
    const overnightCheckbox = screen.getByRole('checkbox')
    const initialDate = (startDateInput as HTMLInputElement).value

    expect(startDateInput).toHaveValue(initialDate)
    expect(endDateInput).toHaveValue(initialDate)

    fireEvent.click(overnightCheckbox)
    expect(endDateInput).toHaveValue(addDays(initialDate, 1))

    fireEvent.click(overnightCheckbox)
    expect(endDateInput).toHaveValue(initialDate)

    fireEvent.change(startDateInput, { target: { value: '2026-05-03' } })
    expect(endDateInput).toHaveValue('2026-05-03')

    fireEvent.click(overnightCheckbox)
    expect(endDateInput).toHaveValue('2026-05-04')
  })
})
