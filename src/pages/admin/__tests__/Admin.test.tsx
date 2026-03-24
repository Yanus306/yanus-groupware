import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { AppProvider } from '../../../features/auth/model'
import { Admin } from '../index'

const mockMembers = [
  { id: '1', name: '김민준', email: 'min@yanus.kr', team: 'BACKEND', role: 'MEMBER', status: 'ACTIVE' },
  { id: '2', name: '이서연', email: 'seo@yanus.kr', team: 'FRONTEND', role: 'TEAM_LEAD', status: 'ACTIVE' },
]

const mockRecords = [
  {
    id: 1,
    memberId: 1,
    memberName: '김민준',
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
      data: { id: '99', name: '관리자', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN' },
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
        { id: 1, name: 'BACKEND' },
        { id: 2, name: 'FRONTEND' },
        { id: 3, name: 'AI' },
        { id: 4, name: 'SECURITY' },
      ],
    }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <Admin />
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
  })

  it('멤버 관리 탭 클릭 시 멤버 테이블이 표시된다', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))
    expect(screen.getByText('멤버 목록')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '퇴출' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: '비활성화' }).length).toBeGreaterThan(0)
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
      expect(screen.getByText('김민준')).toBeInTheDocument()
    })
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
  })
})
