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
        { id: '1', name: '김리더', role: 'ADMIN', team: 'BACKEND', email: 'leader@test.com' },
        { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: 'FRONTEND', email: 'teamlead@test.com' },
      ],
    },
    isAdmin: true,
    loadMembers: mockLoadMembers,
  }),
}))

describe('Members 페이지', () => {
  it('Member Management 제목이 렌더링된다', () => {
    render(<Members />)
    expect(screen.getByText('Member Management')).toBeInTheDocument()
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

  it('관리자에게 Actions 컬럼이 표시된다', () => {
    render(<Members />)
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })
})
