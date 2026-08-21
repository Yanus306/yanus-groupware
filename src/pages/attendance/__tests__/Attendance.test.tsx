import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { attendanceHandlers } from '../../../shared/api/mock/handlers/attendance'
import { getDateStringsBetween, getTodayStr, getWeekRange, parseDateString } from '../../../shared/lib/date'
import { Attendance } from '../index'

const server = setupServer(...attendanceHandlers)
beforeAll(() => server.listen())
beforeEach(() => {
  mocks.useApp.mockReturnValue({
    state: { currentUser: { id: '1', name: '김리더', role: 'ADMIN' }, users: [] },
    isAdmin: true,
    isTeamLead: false,
  })
  mocks.useWorkSession.mockReturnValue({
    status: 'idle',
    clockIn: null,
    clockOut: null,
    handleClockClick: vi.fn(),
    errorMessage: null,
    clearError: vi.fn(),
    isLoading: false,
  })
})
afterEach(() => server.resetHandlers())
afterEach(() => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
})
afterAll(() => server.close())

const mocks = vi.hoisted(() => ({
  useApp: vi.fn(),
  useWorkSession: vi.fn(),
}))

vi.mock('../../../features/auth/model', () => ({ useApp: mocks.useApp }))
vi.mock('../../../features/attendance/model/useWorkSession', () => ({
  useWorkSession: mocks.useWorkSession,
}))

vi.mock('../../../features/attendance/ui', () => ({
  SetWorkDaysPersonal: () => <div data-testid="set-work-days" />,
}))

describe('Attendance 페이지', () => {
  it('관리자 보드 헤더와 처리 필요 요약을 렌더링한다', () => {
    render(<Attendance />)
    expect(screen.getByRole('heading', { name: '출석 관리' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '처리 필요' })).toBeInTheDocument()
  })

  it('관리자에게 Export CSV 버튼이 표시된다', () => {
    render(<Attendance />)
    expect(screen.getByRole('button', { name: 'CSV 내보내기' })).toBeInTheDocument()
  })

  it('관리자 필터와 검색으로 기록을 좁힐 수 있다', async () => {
    const user = userEvent.setup()
    render(<Attendance />)
    expect(screen.getByRole('button', { name: '오늘' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이번 주' })).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: '멤버 검색' })
    await user.type(searchInput, '박')

    expect(screen.getByText('박팀장')).toBeInTheDocument()
    expect(screen.queryByText('김리더')).not.toBeInTheDocument()
  })

  it('팀장에게 운영 보드와 소속 팀 기록만 표시한다', async () => {
    mocks.useApp.mockReturnValue({
      state: {
        currentUser: { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: '1팀' },
        users: [
          { id: '1', name: '김리더', role: 'ADMIN', team: '1팀' },
          { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: '1팀' },
          { id: '3', name: '이멤버', role: 'MEMBER', team: '2팀' },
        ],
      },
      isAdmin: false,
      isTeamLead: true,
    })
    server.use(
      http.get('/api/v1/attendances', () =>
        HttpResponse.json({
          code: 'SUCCESS',
          message: 'ok',
          data: [
            { id: 1, memberId: 1, memberName: '김리더', workDate: getTodayStr(), checkInTime: `${getTodayStr()}T09:00:00`, checkOutTime: null, status: 'WORKING' },
            { id: 2, memberId: 2, memberName: '박팀장', workDate: getTodayStr(), checkInTime: `${getTodayStr()}T09:10:00`, checkOutTime: null, status: 'WORKING' },
            { id: 3, memberId: 3, memberName: '이멤버', workDate: getTodayStr(), checkInTime: `${getTodayStr()}T09:20:00`, checkOutTime: null, status: 'WORKING' },
          ],
        }),
      ),
    )

    render(<Attendance />)

    expect(screen.getByRole('heading', { name: '출석 관리' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('김리더')).toBeInTheDocument()
      expect(screen.getByText('박팀장')).toBeInTheDocument()
      expect(screen.queryByText('이멤버')).not.toBeInTheDocument()
    })
  })

  it('이번 주 필터는 주간 날짜 전체를 조회한다', async () => {
    const requestedDates: string[] = []
    const today = getTodayStr()
    const week = getWeekRange(today)
    const expectedDates = getDateStringsBetween(week.start, week.end)
    server.use(
      http.get('/api/v1/attendances', ({ request }) => {
        const date = new URL(request.url).searchParams.get('date')
        if (date) requestedDates.push(date)
        return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] })
      }),
    )

    const user = userEvent.setup()
    render(<Attendance />)
    await user.click(screen.getByRole('button', { name: '이번 주' }))

    await waitFor(() => {
      expect(new Set(requestedDates)).toEqual(new Set(expectedDates))
    })
  })

  it('출퇴근 기록을 로드한다', async () => {
    render(<Attendance />)
    await waitFor(() => {
      expect(screen.getByText('김리더')).toBeInTheDocument()
      expect(screen.getByText('박팀장')).toBeInTheDocument()
    })
  })

  it('관리자가 기록을 선택하면 상세 패널을 연다', async () => {
    const user = userEvent.setup()
    render(<Attendance />)

    const recordButton = await screen.findByRole('button', { name: '김리더 기록 상세 보기' })
    await user.click(recordButton)

    const detailPanel = screen.getByRole('complementary')
    expect(screen.getByRole('heading', { name: '김리더 상세' })).toBeInTheDocument()
    expect(detailPanel).toHaveTextContent('09:02')
    expect(detailPanel).toHaveTextContent('18:15')
  })

  it('오늘 기록이 없으면 운영 빈 상태를 표시한다', async () => {
    server.use(
      http.get('/api/v1/attendances', () =>
        HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
      ),
    )

    render(<Attendance />)

    expect(await screen.findByText('처리할 출석 기록이 없습니다')).toBeInTheDocument()
  })

  it('멤버에게 오늘 CTA와 상태 타임라인을 표시한다', async () => {
    localStorage.setItem('accessToken', 'mock-token-3')
    mocks.useApp.mockReturnValue({
      state: { currentUser: { id: '3', name: '이멤버', role: 'MEMBER' }, users: [] },
      isAdmin: false,
    })

    render(<Attendance />)

    expect(screen.getByRole('heading', { name: '오늘 출석' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '출근하기' })).toBeInTheDocument()
    expect(screen.getAllByText('출근 전').length).toBeGreaterThan(0)
    const expectedScheduleByDay = ['휴무', '08:30 - 17:30', '휴무', '08:30 - 17:30', '휴무', '08:30 - 17:30', '휴무']
    expect(await screen.findByText(expectedScheduleByDay[parseDateString(getTodayStr()).getDay()])).toBeInTheDocument()
  })

  it('멤버가 오늘 CTA를 누르면 출퇴근 액션을 호출한다', async () => {
    const user = userEvent.setup()
    const handleClockClick = vi.fn()
    mocks.useApp.mockReturnValue({
      state: { currentUser: { id: '3', name: '이멤버', role: 'MEMBER' }, users: [] },
      isAdmin: false,
    })
    mocks.useWorkSession.mockReturnValue({
      status: 'idle',
      clockIn: null,
      clockOut: null,
      handleClockClick,
      errorMessage: null,
      clearError: vi.fn(),
      isLoading: false,
    })

    render(<Attendance />)
    await user.click(screen.getByRole('button', { name: '출근하기' }))

    expect(handleClockClick).toHaveBeenCalledOnce()
  })

  it('멤버 CTA 동작 후 개인 출퇴근 기록을 다시 로드한다', async () => {
    const user = userEvent.setup()
    const handleClockClick = vi.fn().mockResolvedValue(undefined)
    let requestCount = 0
    mocks.useApp.mockReturnValue({
      state: { currentUser: { id: '3', name: '이멤버', role: 'MEMBER' }, users: [] },
      isAdmin: false,
      isTeamLead: false,
    })
    mocks.useWorkSession.mockReturnValue({
      status: 'idle',
      clockIn: null,
      clockOut: null,
      handleClockClick,
      errorMessage: null,
      clearError: vi.fn(),
      isLoading: false,
    })
    server.use(
      http.get('/api/v1/attendances/me', () => {
        requestCount += 1
        return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] })
      }),
    )

    render(<Attendance />)
    await waitFor(() => expect(requestCount).toBe(1))
    await user.click(screen.getByRole('button', { name: '출근하기' }))

    await waitFor(() => expect(requestCount).toBe(2))
    expect(handleClockClick).toHaveBeenCalledOnce()
  })

  it('출퇴근 처리 중에는 CTA를 중복 실행할 수 없다', () => {
    mocks.useApp.mockReturnValue({
      state: { currentUser: { id: '3', name: '이멤버', role: 'MEMBER' }, users: [] },
      isAdmin: false,
      isTeamLead: false,
    })
    mocks.useWorkSession.mockReturnValue({
      status: 'idle',
      clockIn: null,
      clockOut: null,
      handleClockClick: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      isLoading: true,
    })

    render(<Attendance />)

    expect(screen.getByRole('button', { name: '출근하기' })).toBeDisabled()
  })

  it('API 오류 시 재시도 가능한 오류 상태를 표시한다', async () => {
    server.use(
      http.get('/api/v1/attendances', () =>
        HttpResponse.json(
          { code: 'ATTENDANCE_LOAD_FAILED', message: '출석 데이터를 불러오지 못했습니다', data: null },
          { status: 500 },
        ),
      ),
    )

    render(<Attendance />)

    expect(await screen.findByText('출석 데이터를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
