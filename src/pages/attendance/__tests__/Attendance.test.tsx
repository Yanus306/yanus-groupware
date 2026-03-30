import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { attendanceHandlers } from '../../../shared/api/mock/handlers/attendance'
import { Attendance } from '../index'

const TODAY = new Date().toISOString().slice(0, 10)

const server = setupServer(
  ...attendanceHandlers,
  http.get('*/api/v1/members', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: 1, name: '김리더', email: 'admin@yanus.kr', team: '1팀', role: 'ADMIN', status: 'ACTIVE' },
      ],
    }),
  ),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '1', name: '김리더', role: 'ADMIN', team: '1팀' },
      users: [
        { id: '1', name: '김리더', role: 'ADMIN', team: '1팀', email: 'admin@yanus.kr', status: 'ACTIVE' },
      ],
      teams: [{ id: 1, name: '1팀' }],
    },
    isAdmin: true,
    isTeamLead: false,
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  TeamAttendanceStatus: () => <div data-testid="team-attendance-status" />,
}))

vi.mock('../../../features/leave/ui/LeaveSection', () => ({
  LeaveSection: () => <div data-testid="leave-section" />,
}))

describe('Attendance 페이지', () => {
  it('출퇴근 헤더가 렌더링된다', () => {
    render(<Attendance />)
    expect(screen.getByText('오늘 근무 현황과 출퇴근 이력을 한 화면에서 확인합니다.')).toBeInTheDocument()
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

  it('기본 범위 라벨로 이번 달이 표시된다', async () => {
    render(<Attendance />)

    const [year, month] = TODAY.split('-')
    const monthStart = `${year}-${month}-01`
    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(`${monthStart} ~ ${year}-${month}`)).length).toBeGreaterThan(0)
    })
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

  it('직접 선택 기간 조회가 날짜 범위 기준으로 동작한다', async () => {
    const requestedDates: string[] = []

    server.use(
      http.get('/api/v1/attendances', ({ request }) => {
        const url = new URL(request.url)
        const date = url.searchParams.get('date') ?? TODAY
        requestedDates.push(date)

        const data = date === '2026-03-01'
          ? [{ id: 11, memberId: 1, memberName: '김리더', workDate: date, checkInTime: `${date}T09:00:00`, checkOutTime: `${date}T18:00:00`, status: 'LEFT' }]
          : []

        return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })
      }),
    )

    render(<Attendance />)

    fireEvent.click(screen.getByRole('button', { name: '직접 선택' }))
    fireEvent.change(screen.getByLabelText('조회 시작일'), { target: { value: '2026-03-01' } })
    fireEvent.change(screen.getByLabelText('조회 종료일'), { target: { value: '2026-03-03' } })
    fireEvent.click(screen.getByRole('button', { name: '조회' }))

    await waitFor(() => {
      expect(requestedDates).toEqual(expect.arrayContaining(['2026-03-01', '2026-03-02', '2026-03-03']))
      expect(screen.getByText('2026-03-01 ~ 2026-03-03')).toBeInTheDocument()
      expect(screen.getAllByText('김리더').length).toBeGreaterThan(0)
    })
  })
})
