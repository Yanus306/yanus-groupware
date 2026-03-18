import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { attendanceHandlers } from '../../../shared/api/mock/handlers/attendance'
import { Attendance } from '../index'

const server = setupServer(...attendanceHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: { currentUser: { id: '1', name: '김리더', role: 'admin' }, users: [] },
    isAdmin: true,
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  SetWorkDaysPersonal: () => <div data-testid="set-work-days" />,
}))

describe('Attendance 페이지', () => {
  it('Attendance 헤더가 렌더링된다', () => {
    render(<Attendance />)
    expect(screen.getByText('Attendance')).toBeInTheDocument()
  })

  it('관리자에게 Export CSV 버튼이 표시된다', () => {
    render(<Attendance />)
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })

  it('필터 탭이 렌더링된다', () => {
    render(<Attendance />)
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
  })

  it('출퇴근 기록을 로드한다', async () => {
    render(<Attendance />)
    await waitFor(() => {
      expect(screen.getAllByText('김리더').length).toBeGreaterThan(0)
    })
  })
})
