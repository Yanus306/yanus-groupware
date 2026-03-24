import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { attendanceHandlers } from '../../../shared/api/mock/handlers/attendance'
import { Attendance } from '../index'

const TODAY = new Date().toISOString().slice(0, 10)

const server = setupServer(...attendanceHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: { currentUser: { id: '1', name: '김리더', role: 'ADMIN', team: 'BACKEND' }, users: [] },
    isAdmin: true,
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  SetWorkDaysPersonal: () => <div data-testid="set-work-days" />,
  TeamAttendanceStatus: () => <div data-testid="team-attendance-status" />,
  TeamWorkSchedulePanel: () => <div data-testid="team-work-schedule-panel" />,
}))

vi.mock('../../../features/leave/ui/LeaveSection', () => ({
  LeaveSection: () => <div data-testid="leave-section" />,
}))

describe('Attendance 페이지', () => {
  it('출퇴근 헤더가 렌더링된다', () => {
    render(<Attendance />)
    expect(screen.getByText('출퇴근')).toBeInTheDocument()
  })

  it('관리자에게 Export CSV 버튼이 표시된다', () => {
    render(<Attendance />)
    expect(screen.getByText('CSV 내보내기')).toBeInTheDocument()
  })

  it('필터 탭이 렌더링된다', () => {
    render(<Attendance />)
    expect(screen.getByText('이번 주')).toBeInTheDocument()
    expect(screen.getByText('이번 달')).toBeInTheDocument()
  })

  it('관리자에게 팀 근무 일정 패널이 표시된다', () => {
    render(<Attendance />)
    expect(screen.getByTestId('team-work-schedule-panel')).toBeInTheDocument()
  })

  it('출퇴근 기록을 로드한다', async () => {
    server.use(
      http.get('/api/v1/attendances', () =>
        HttpResponse.json({
          code: 'SUCCESS', message: 'ok',
          data: [{ id: 1, memberId: 1, memberName: '김리더', workDate: TODAY, checkInTime: `${TODAY}T09:00:00`, checkOutTime: `${TODAY}T18:00:00`, status: 'LEFT' }],
        }),
      ),
    )
    render(<Attendance />)
    await waitFor(() => {
      expect(screen.getAllByText('김리더').length).toBeGreaterThan(0)
    })
  })

  it('출퇴근 기록의 근무 요일에 멤버 근무 일정이 반영된다', async () => {
    server.use(
      http.get('/api/v1/attendances', () =>
        HttpResponse.json({
          code: 'SUCCESS', message: 'ok',
          data: [{ id: 1, memberId: 1, memberName: '김리더', workDate: TODAY, checkInTime: `${TODAY}T09:00:00`, checkOutTime: `${TODAY}T18:00:00`, status: 'LEFT' }],
        }),
      ),
    )

    render(<Attendance />)

    await waitFor(() => {
      const scheduledDaysCell = screen.getByTestId('scheduled-days-1')
      expect(within(scheduledDaysCell).getAllByLabelText(/근무 예정/)).toHaveLength(3)
      expect(within(scheduledDaysCell).getAllByLabelText(/휴무/)).toHaveLength(4)
    })
  })
})
