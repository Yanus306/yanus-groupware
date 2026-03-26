import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { membersHandlers } from '../../../shared/api/mock/handlers/members'
import { TeamManagement } from '../index'

const server = setupServer(...membersHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockLoadMembers = vi.fn()
const mockRefreshMembers = vi.fn().mockResolvedValue([])
const mockRefreshTeams = vi.fn().mockResolvedValue([])

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: '2팀', email: 'lead@test.com' },
      users: [
        { id: '1', name: '김관리자', role: 'ADMIN', team: '2팀', email: 'admin@test.com', status: 'ACTIVE' },
        { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: '2팀', email: 'lead@test.com', status: 'ACTIVE' },
        { id: '3', name: '한멤버', role: 'MEMBER', team: '2팀', email: 'member2@test.com', status: 'ACTIVE' },
        { id: '4', name: '이멤버', role: 'MEMBER', team: '1팀', email: 'member@test.com', status: 'ACTIVE' },
        { id: '5', name: '휴면멤버', role: 'MEMBER', team: '2팀', email: 'inactive@test.com', status: 'INACTIVE' },
      ],
      teams: [
        { id: 1, name: '1팀' },
        { id: 2, name: '2팀' },
        { id: 3, name: '3팀' },
      ],
    },
    isAdmin: false,
    isTeamLead: true,
    loadMembers: mockLoadMembers,
    refreshMembers: mockRefreshMembers,
    refreshTeams: mockRefreshTeams,
  }),
}))

describe('TeamManagement 페이지', () => {
  it('팀장 전용 안내 문구가 렌더링된다', () => {
    render(<TeamManagement />)
    expect(screen.getByText('팀장은 같은 팀 멤버를 확인하고 팀 이동만 관리할 수 있습니다.')).toBeInTheDocument()
  })

  it('현재 팀 멤버만 표시된다', async () => {
    render(<TeamManagement />)

    await waitFor(() => {
      expect(screen.getByText('한멤버')).toBeInTheDocument()
    })

    expect(screen.queryByText('박팀장')).not.toBeInTheDocument()
    expect(screen.queryByText('김관리자')).not.toBeInTheDocument()
    expect(screen.queryByText('김리더')).not.toBeInTheDocument()
    expect(screen.queryByText('이멤버')).not.toBeInTheDocument()
    expect(screen.queryByText('휴면멤버')).not.toBeInTheDocument()
  })

  it('팀 변경 액션은 이동 가능한 일반 멤버에게만 렌더링된다', async () => {
    render(<TeamManagement />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /팀 변경/ })).toBeInTheDocument()
    })

    expect(screen.getAllByRole('button', { name: /팀 변경/ })).toHaveLength(1)
  })

  it('팀 변경 저장 시 성공 메시지가 표시된다', async () => {
    const user = userEvent.setup()
    render(<TeamManagement />)

    await waitFor(() => {
      expect(screen.getByText('한멤버')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /팀 변경/ }))
    await user.click(screen.getByRole('button', { name: '3팀' }))
    await user.click(screen.getByRole('button', { name: '팀 변경 저장' }))

    await waitFor(() => {
      expect(screen.getByText(/한멤버의 팀을 3팀으로 변경했습니다/)).toBeInTheDocument()
    })
  })
})
