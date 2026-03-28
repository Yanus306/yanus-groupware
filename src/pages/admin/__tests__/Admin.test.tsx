import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { AppProvider, useApp } from '../../../features/auth/model'
import type { User } from '../../../entities/user/model/types'
import { Admin } from '../index'

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
    workDate: '2026-03-23',
    checkInTime: '2026-03-23T09:00:00',
    checkOutTime: null,
    status: 'WORKING',
  },
]

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
  http.get('/api/v1/attendances', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockRecords }),
  ),
  http.get('/api/v1/teams', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: 1, name: '1팀' },
        { id: 2, name: '2팀' },
        { id: 3, name: '3팀' },
        { id: 4, name: '4팀' },
      ],
    }),
  ),
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
  })

  it('멤버 관리 탭 클릭 시 멤버 테이블이 표시된다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))
    expect(screen.getByText('멤버 목록')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '활성화' }).length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('관리 메뉴 열기').length).toBeGreaterThan(0)
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
})
