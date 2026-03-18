import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from '../index'

vi.mock('../../../features/attendance/model/useWorkSession', () => ({
  useWorkSession: () => ({
    status: 'idle',
    clockIn: null,
    clockOut: null,
    handleClockClick: vi.fn(),
  }),
}))

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: { currentUser: { id: '1', name: '홍길동', role: 'member' }, users: [] },
    isAdmin: false,
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  AnimatedClockRing: ({ children }: { children: React.ReactNode }) => <div data-testid="clock-ring">{children}</div>,
}))

describe('Dashboard 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('대시보드 페이지가 렌더링된다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByTestId('clock-ring')).toBeInTheDocument()
  })

  it('idle 상태에서 출근 텍스트를 표시한다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByText('출근')).toBeInTheDocument()
  })

  it('스케줄 카드와 팀 채팅 카드가 렌더링된다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByText("Today's Schedule")).toBeInTheDocument()
    expect(screen.getByText('Team Chat')).toBeInTheDocument()
  })
})
