import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { attendanceHandlers } from '../../../shared/api/mock/handlers/attendance'
import { WorkSchedules } from '../index'

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockRefreshMembers = vi.fn(async () => [])
const mockRefreshTeams = vi.fn(async () => [])

let mockState = {
  currentUser: { id: '1', name: '관리자', role: 'ADMIN', team: '1팀' },
  users: [
    { id: '1', name: '관리자', role: 'ADMIN', team: '1팀', email: 'admin@yanus.kr', status: 'ACTIVE' },
    { id: '2', name: '김팀원', role: 'MEMBER', team: '1팀', email: 'member@yanus.kr', status: 'ACTIVE' },
  ],
  teams: [
    { id: 1, name: '1팀' },
    { id: 2, name: '2팀' },
  ],
}

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: mockState,
    refreshMembers: mockRefreshMembers,
    refreshTeams: mockRefreshTeams,
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  SetWorkDaysPersonal: ({ onSaved }: { onSaved?: () => void }) => (
    <button type="button" onClick={() => onSaved?.()}>
      mock-editor
    </button>
  ),
  TeamWorkSchedulePanel: ({ schedules }: { schedules: Array<{ memberId: number; memberName: string }> }) => (
    <div data-testid="team-work-schedule-panel">
      {schedules.map((schedule) => (
        <span key={schedule.memberId}>{schedule.memberName}</span>
      ))}
    </div>
  ),
}))

describe('WorkSchedules 페이지', () => {
  beforeEach(() => {
    mockRefreshMembers.mockClear()
    mockRefreshTeams.mockClear()
  })

  it('관리자는 전체, 팀별, 개인 조회 범위를 볼 수 있다', async () => {
    mockState = {
      currentUser: { id: '1', name: '관리자', role: 'ADMIN', team: '1팀' },
      users: [
        { id: '1', name: '관리자', role: 'ADMIN', team: '1팀', email: 'admin@yanus.kr', status: 'ACTIVE' },
        { id: '2', name: '김팀원', role: 'MEMBER', team: '1팀', email: 'member@yanus.kr', status: 'ACTIVE' },
      ],
      teams: [
        { id: 1, name: '1팀' },
        { id: 2, name: '2팀' },
      ],
    }

    render(<WorkSchedules />)

    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '팀별' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '개인' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('1팀 근무 일정')).toBeInTheDocument()
    })
  })

  it('일반 멤버는 본인 일정만 조회한다는 안내를 본다', async () => {
    mockState = {
      currentUser: { id: '2', name: '일반멤버', role: 'MEMBER', team: '1팀' },
      users: [
        { id: '2', name: '일반멤버', role: 'MEMBER', team: '1팀', email: 'member@yanus.kr', status: 'ACTIVE' },
      ],
      teams: [{ id: 1, name: '1팀' }],
    }

    render(<WorkSchedules />)

    expect(screen.queryByRole('button', { name: '전체' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '팀별' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '개인' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('현재 API 권한 기준으로 일반 멤버는 본인 근무 일정만 조회할 수 있습니다.')).toBeInTheDocument()
      expect(screen.getByText('일반멤버 근무 일정')).toBeInTheDocument()
    })
  })
})
