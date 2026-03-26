import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AdminRoute } from '../AdminRoute'

// mock useApp
vi.mock('../../../../features/auth/model', () => ({
  useApp: vi.fn(),
}))

import { useApp } from '../../../../features/auth/model'

const mockUseApp = vi.mocked(useApp)

function TestLayout() {
  return (
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div data-testid="home">홈</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div data-testid="admin-content">관리자 페이지</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminRoute', () => {
  it('isAdmin이 true이면 자식 라우트를 렌더링한다', () => {
    mockUseApp.mockReturnValue({
      isAdmin: true,
      isTeamLead: false,
      isInitializing: false,
      isBootstrapping: false,
      state: { currentUser: { id: '1', name: '관리자', email: 'admin@test.com', team: '1팀', role: 'ADMIN' }, users: [], teams: [] },
      loadUser: vi.fn(),
      loadMembers: vi.fn(),
      loadTeams: vi.fn(),
      refreshCurrentUser: vi.fn(),
      refreshMembers: vi.fn(),
      refreshTeams: vi.fn(),
      setBootstrapping: vi.fn(),
      logout: vi.fn(),
    })
    render(<TestLayout />)
    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('isAdmin이 false이면 홈으로 리다이렉트한다', () => {
    mockUseApp.mockReturnValue({
      isAdmin: false,
      isTeamLead: true,
      isInitializing: false,
      isBootstrapping: false,
      state: { currentUser: { id: '2', name: '팀장', email: 'lead@test.com', team: '1팀', role: 'TEAM_LEAD' }, users: [], teams: [] },
      loadUser: vi.fn(),
      loadMembers: vi.fn(),
      loadTeams: vi.fn(),
      refreshCurrentUser: vi.fn(),
      refreshMembers: vi.fn(),
      refreshTeams: vi.fn(),
      setBootstrapping: vi.fn(),
      logout: vi.fn(),
    })
    render(<TestLayout />)
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('home')).toBeInTheDocument()
  })
})
