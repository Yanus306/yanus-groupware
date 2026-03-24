import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TeamLeadRoute } from '../TeamLeadRoute'

vi.mock('../../../../features/auth/model', () => ({
  useApp: vi.fn(),
}))

import { useApp } from '../../../../features/auth/model'

const mockUseApp = vi.mocked(useApp)

function TestLayout() {
  return (
    <MemoryRouter initialEntries={['/team-management']}>
      <Routes>
        <Route path="/" element={<div data-testid="home">홈</div>} />
        <Route element={<TeamLeadRoute />}>
          <Route path="/team-management" element={<div data-testid="team-management-content">팀 관리 페이지</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('TeamLeadRoute', () => {
  it('isTeamLead가 true이면 자식 라우트를 렌더링한다', () => {
    mockUseApp.mockReturnValue({
      isAdmin: false,
      isTeamLead: true,
      isInitializing: false,
      state: { currentUser: null, users: [] },
      loadUser: vi.fn(),
      loadMembers: vi.fn(),
      logout: vi.fn(),
    })
    render(<TestLayout />)
    expect(screen.getByTestId('team-management-content')).toBeInTheDocument()
  })

  it('isTeamLead가 false이면 홈으로 리다이렉트한다', () => {
    mockUseApp.mockReturnValue({
      isAdmin: true,
      isTeamLead: false,
      isInitializing: false,
      state: { currentUser: null, users: [] },
      loadUser: vi.fn(),
      loadMembers: vi.fn(),
      logout: vi.fn(),
    })
    render(<TestLayout />)
    expect(screen.queryByTestId('team-management-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('home')).toBeInTheDocument()
  })
})
