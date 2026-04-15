import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { AppProvider, useApp } from '../../../features/auth/model'
import type { User } from '../../../entities/user/model/types'
import { getTodayStr } from '../../../shared/lib/date'
import { Admin } from '../index'

const TODAY_STR = getTodayStr()
const CURRENT_YEAR_MONTH = TODAY_STR.slice(0, 7)
const CURRENT_LATE_DATE = `${CURRENT_YEAR_MONTH}-04`
const CURRENT_NO_SCHEDULE_DATE = `${CURRENT_YEAR_MONTH}-18`

const mockMembers = [
  { id: '99', name: '관리자', email: 'admin@yanus.kr', team: '1팀', role: 'ADMIN', status: 'ACTIVE' },
  { id: '1', name: '이서연', email: 'seo@yanus.kr', team: '2팀', role: 'TEAM_LEAD', status: 'ACTIVE' },
  { id: '2', name: '강민준', email: 'kang@yanus.kr', team: '1팀', role: 'MEMBER', status: 'ACTIVE' },
  { id: '3', name: '김민준', email: 'min@yanus.kr', team: '1팀', role: 'MEMBER', status: 'ACTIVE' },
  { id: '4', name: '한비활성', email: 'inactive@yanus.kr', team: '1팀', role: 'MEMBER', status: 'INACTIVE' },
]

const mockRecords = [
  {
    id: 1,
    memberId: 1,
    memberName: '이서연',
    workDate: TODAY_STR,
    checkInTime: `${TODAY_STR}T09:00:00`,
    checkOutTime: null,
    status: 'WORKING',
  },
  {
    id: 2,
    memberId: 2,
    memberName: '강민준',
    workDate: CURRENT_LATE_DATE,
    checkInTime: `${CURRENT_LATE_DATE}T09:07:10`,
    checkOutTime: `${CURRENT_LATE_DATE}T18:02:01`,
    status: 'LEFT',
  },
  {
    id: 3,
    memberId: 3,
    memberName: '김민준',
    workDate: CURRENT_NO_SCHEDULE_DATE,
    checkInTime: `${CURRENT_NO_SCHEDULE_DATE}T09:05:00`,
    checkOutTime: `${CURRENT_NO_SCHEDULE_DATE}T18:03:00`,
    status: 'LEFT',
  },
]

const mockAuditLogs = [
  {
    id: 1,
    actorId: 99,
    actorRole: 'ADMIN',
    targetId: 2,
    action: 'TEAM_CHANGE',
    previousValue: '1팀',
    newValue: '2팀',
    createdAt: '2026-03-29T10:00:00',
  },
]

const mockSettlement = {
  yearMonth: CURRENT_YEAR_MONTH,
  memberId: 2,
  memberName: '강민준',
  teamName: '1팀',
  scheduledDays: 12,
  attendedDays: 11,
  lateDays: 3,
  totalLateMinutes: 27,
  lateFee: 2700,
  items: [
    {
      date: CURRENT_LATE_DATE,
      scheduledStartTime: '09:00:00',
      scheduledEndTime: '18:00:00',
      checkInTime: `${CURRENT_LATE_DATE}T09:07:10`,
      checkOutTime: `${CURRENT_LATE_DATE}T18:02:01`,
      lateMinutes: 7,
      fee: 700,
      status: 'LATE',
    },
  ],
}

const mockTemporaryPassword = 'A1b2C3d4'
const mockAutoCheckoutTime = '23:59:59'

const server = setupServer(
  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: '99', name: '관리자', email: 'admin@yanus.kr', team: '1팀', role: 'ADMIN' },
    }),
  ),
  http.get('/api/v1/members', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockMembers }),
  ),
  http.get('/api/v1/attendances', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const data = date ? mockRecords.filter((record) => record.workDate === date) : mockRecords
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })
  }),
  http.get('/api/v1/teams', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: 1, name: '1팀' },
        { id: 2, name: '2팀' },
        { id: 3, name: '3팀' },
        { id: 4, name: '4팀' },
        { id: 5, name: '신입' },
      ],
    }),
  ),
  http.get('/api/v1/audit-logs', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockAuditLogs }),
  ),
  http.get('/api/v1/attendance-settlements/monthly', ({ request }) => {
    const url = new URL(request.url)
    const targetMemberId = Number(url.searchParams.get('targetMemberId') ?? '2')
    const targetMember = mockMembers.find((member) => Number(member.id) === targetMemberId) ?? mockMembers[2]
    const settlementByMemberId: Record<number, typeof mockSettlement> = {
      2: mockSettlement,
      3: {
        ...mockSettlement,
        memberId: 3,
        memberName: '김민준',
        teamName: '1팀',
        scheduledDays: 0,
        attendedDays: 1,
        lateDays: 0,
        totalLateMinutes: 0,
        lateFee: 0,
        items: [],
      },
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        ...(settlementByMemberId[targetMemberId] ?? {
          ...mockSettlement,
          scheduledDays: 0,
          attendedDays: 0,
          lateDays: 0,
          totalLateMinutes: 0,
          lateFee: 0,
          items: [],
        }),
        memberId: Number(targetMember.id),
        memberName: targetMember.name,
        teamName: targetMember.team,
      },
    })
  }),
  http.post('/api/v1/members/:memberId/reset-password', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { temporaryPassword: mockTemporaryPassword },
    }),
  ),
  http.get('/api/v1/settings/auto-checkout-time', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { autoCheckoutTime: mockAutoCheckoutTime },
    }),
  ),
  http.patch('/api/v1/settings/auto-checkout-time', async ({ request }) => {
    const body = await request.json() as { autoCheckoutTime: string }
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { autoCheckoutTime: body.autoCheckoutTime },
    })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function AdminBootstrap({ children }: { children: ReactNode }) {
  const { loadUser, loadMembers, loadTeams } = useApp()

  useEffect(() => {
    loadUser({ id: '99', name: '관리자', email: 'admin@yanus.kr', team: '1팀', role: 'ADMIN', status: 'ACTIVE' })
    loadMembers(mockMembers as User[])
    loadTeams([
      { id: 1, name: '1팀' },
      { id: 2, name: '2팀' },
      { id: 3, name: '3팀' },
      { id: 4, name: '4팀' },
      { id: 5, name: '신입' },
    ])
  }, [loadMembers, loadTeams, loadUser])

  return <>{children}</>
}

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <AdminBootstrap>
          <Admin />
        </AdminBootstrap>
      </AppProvider>
    </MemoryRouter>,
  )
}

describe('Admin 페이지', () => {
  it('페이지 제목이 렌더링된다', () => {
    renderAdmin()
    expect(screen.getByText('출근 현황과 멤버 상태를 한 곳에서 관리합니다.')).toBeInTheDocument()
  })

  it('출근 현황 탭이 기본으로 활성화된다', () => {
    renderAdmin()
    const tab = screen.getByRole('button', { name: '출근 현황' })
    expect(tab).toHaveClass('active')
  })

  it('멤버 관리 탭이 존재한다', () => {
    renderAdmin()
    expect(screen.getByRole('button', { name: '멤버 관리' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '팀 관리' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '감사 로그' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '지각비 정산' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '운영 설정' })).toBeInTheDocument()
  })

  it('운영 설정 탭에서 자동 체크아웃 시간을 확인할 수 있다', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await user.click(screen.getByRole('button', { name: '운영 설정' }))

    expect(await screen.findByLabelText('자동 체크아웃 시간 입력')).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockAutoCheckoutTime)).toBeInTheDocument()
  })

  it('운영 설정 탭에서 자동 체크아웃 시간을 저장할 수 있다', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await user.click(screen.getByRole('button', { name: '운영 설정' }))
    await screen.findByDisplayValue(mockAutoCheckoutTime)

    await user.clear(screen.getByLabelText('자동 체크아웃 시간 입력'))
    await user.type(screen.getByLabelText('자동 체크아웃 시간 입력'), '220000')
    await user.click(screen.getByRole('button', { name: '자동 체크아웃 시간 저장' }))

    await waitFor(() => {
      expect(screen.getByText('자동 체크아웃 시간을 저장했습니다')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('22:00:00')).toBeInTheDocument()
  })

  it('멤버 관리 탭 클릭 시 멤버 테이블이 표시된다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))
    expect(screen.getByText('멤버 목록')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '활성화' }).length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('관리 메뉴 열기').length).toBeGreaterThan(0)
  })

  it('관리자는 멤버 관리 메뉴에서 임시 비밀번호를 발급할 수 있다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))

    const targetRow = screen.getByText('강민준').closest('tr')
    expect(targetRow).not.toBeNull()

    const scoped = within(targetRow as HTMLTableRowElement)
    await user.click(scoped.getByLabelText('관리 메뉴 열기'))
    await user.click(screen.getByRole('menuitem', { name: '임시 비밀번호 발급' }))

    expect(await screen.findByText('임시 비밀번호가 발급되었습니다')).toBeInTheDocument()
    expect(screen.getByText(mockTemporaryPassword)).toBeInTheDocument()
  })

  it('관리자는 본인 계정에 대해 역할, 상태, 퇴출 액션을 볼 수 없다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))

    const selfRow = screen.getAllByText('관리자')[0]?.closest('tr')
    expect(selfRow).not.toBeNull()
    const scoped = within(selfRow as HTMLTableRowElement)

    expect(scoped.getByText('관리 불가')).toBeInTheDocument()
    expect(scoped.queryByRole('button', { name: '활성화' })).not.toBeInTheDocument()
    expect(scoped.queryByLabelText('관리 메뉴 열기')).not.toBeInTheDocument()
  })

  it('멤버 목록은 팀 순, 이름 순이며 비활성 멤버는 마지막에 표시된다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))

    await waitFor(() => {
      expect(screen.getByText('강민준')).toBeInTheDocument()
      expect(screen.getByText('김민준')).toBeInTheDocument()
      expect(screen.getByText('이서연')).toBeInTheDocument()
      expect(screen.getByText('한비활성')).toBeInTheDocument()
    })

    const activeFirst = screen.getByText('강민준')
    const activeSecond = screen.getByText('김민준')
    const otherTeam = screen.getByText('이서연')
    const inactiveLast = screen.getByText('한비활성')

    expect(activeFirst.compareDocumentPosition(activeSecond) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(activeSecond.compareDocumentPosition(otherTeam) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(otherTeam.compareDocumentPosition(inactiveLast) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('출근 현황 탭에 요약 카운트가 표시된다', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('근무 중')).toBeInTheDocument()
      expect(screen.getByText('퇴근')).toBeInTheDocument()
      expect(screen.getByText('미출근')).toBeInTheDocument()
    })
  })

  it('출근 현황 탭 기본 필터(근무 중)에 근무 중인 팀원만 표시된다', async () => {
    renderAdmin()
    await waitFor(() => {
      expect(screen.getByText('이서연')).toBeInTheDocument()
    })
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
  })

  it('감사 로그 탭 클릭 시 로그 테이블이 표시된다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '감사 로그' }))

    expect(await screen.findByRole('heading', { name: '감사 로그' })).toBeInTheDocument()
    expect(screen.getByText('팀 변경')).toBeInTheDocument()
    expect(screen.getByText('2팀')).toBeInTheDocument()
  })

  it('지각비 정산 탭은 기본적으로 전체 섹션을 보여준다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '지각비 정산' }))

    expect(await screen.findByRole('heading', { name: '월별 지각비 정산' })).toBeInTheDocument()
    expect(screen.getByDisplayValue(CURRENT_YEAR_MONTH)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '전체' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: '전체 정산 요약' })).toBeInTheDocument()
    expect(screen.getByText('월별 전체 지각비')).toBeInTheDocument()
    expect(screen.getByText('6,700원')).toBeInTheDocument()
    expect(screen.getByText('미기재 출근')).toBeInTheDocument()
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getAllByText('김민준').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3,000원').length).toBeGreaterThan(0)
  })

  it('지각비 정산 탭의 팀 섹션에서 팀별 정산을 볼 수 있다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '지각비 정산' }))
    await user.click(screen.getByRole('tab', { name: '팀' }))

    expect(screen.getByRole('tab', { name: '팀' })).toHaveAttribute('aria-selected', 'true')
    await user.selectOptions(screen.getByRole('combobox', { name: '팀 선택' }), '1팀')

    expect(await screen.findByRole('heading', { name: '1팀 정산 요약' })).toBeInTheDocument()
    expect(screen.getByText('팀 전체 지각비')).toBeInTheDocument()
    expect(screen.getAllByText('강민준').length).toBeGreaterThan(0)
  })

  it('지각비 정산 탭의 개인 섹션에서 멤버별 상세 정산을 볼 수 있다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '지각비 정산' }))
    await user.click(screen.getByRole('tab', { name: '개인' }))

    expect(screen.getByRole('tab', { name: '개인' })).toHaveAttribute('aria-selected', 'true')
    await user.selectOptions(screen.getByRole('combobox', { name: '상세 멤버' }), '2')

    expect(await screen.findByRole('heading', { name: '강민준 상세 정산' })).toBeInTheDocument()
    expect(screen.getByText(CURRENT_LATE_DATE)).toBeInTheDocument()
    expect(screen.getAllByText('700원').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '개인 출근 내역 CSV' })).toBeInTheDocument()
  })

  it('팀 관리 탭에서 신입 팀 삭제 버튼은 비활성화된다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '팀 관리' }))

    const recruitCard = screen.getByText('신입').closest('article')
    expect(recruitCard).not.toBeNull()

    const scoped = within(recruitCard as HTMLElement)
    expect(scoped.getByRole('button', { name: '삭제 불가' })).toBeDisabled()
    expect(scoped.getByText('신입 팀은 신규 가입자의 기본 배정 팀이라 삭제할 수 없습니다.')).toBeInTheDocument()
  })
})
