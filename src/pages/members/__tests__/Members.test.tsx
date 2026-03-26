import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { membersHandlers } from '../../../shared/api/mock/handlers/members'
import { Members } from '../index'

const server = setupServer(...membersHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockLoadMembers = vi.fn()

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '1', name: '김리더', role: 'ADMIN' },
      users: [
        { id: '1', name: '김리더', role: 'ADMIN', team: '1팀', email: 'leader@test.com' },
        { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: '2팀', email: 'teamlead@test.com' },
      ],
    },
    isAdmin: true,
    isTeamLead: false,
    loadMembers: mockLoadMembers,
  }),
}))

describe('Members 페이지', () => {
  it('멤버 관리 안내 문구가 렌더링된다', () => {
    render(<Members />)
    expect(screen.getByText('멤버 상태와 역할을 한 곳에서 확인하고 관리합니다.')).toBeInTheDocument()
  })

  it('관리자에게 멤버 초대 버튼이 표시된다', () => {
    render(<Members />)
    expect(screen.getByText('멤버 초대')).toBeInTheDocument()
  })

  it('멤버 목록이 렌더링된다', async () => {
    render(<Members />)
    await waitFor(() => {
      expect(screen.getByText('김리더')).toBeInTheDocument()
      expect(screen.getByText('박팀장')).toBeInTheDocument()
    })
  })

  it('관리자에게 관리 컬럼이 표시된다', () => {
    render(<Members />)
    expect(screen.getByText('관리')).toBeInTheDocument()
  })

  it('관리 컬럼에 상태 및 퇴출 액션이 함께 표시된다', async () => {
    render(<Members />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '비활성화' }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('button', { name: '퇴출' }).length).toBeGreaterThan(0)
    })
  })
})
