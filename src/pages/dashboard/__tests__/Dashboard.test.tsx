import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from '../index'

const mockUpdateEvent = vi.fn()
const mockDeleteEvent = vi.fn()
const mockToggleTaskDone = vi.fn()

vi.mock('../../../features/attendance/model/useWorkSession', () => ({
  useWorkSession: () => ({
    status: 'idle',
    clockIn: null,
    clockOut: null,
    handleClockClick: vi.fn(),
    errorMessage: null,
    toastType: 'info',
    clearError: vi.fn(),
    isLoading: false,
  }),
}))

vi.mock('../../../features/attendance/ui', () => ({
  AnimatedClockRing: () => <div data-testid="clock-ring" />,
}))

vi.mock('../../../features/attendance/model/useWorkSchedule', () => ({
  useWorkSchedule: () => ({
    workDays: [true, false, false, false, false, false, false],
    daySchedules: [
      { checkInTime: '09:00', checkOutTime: '18:00' },
      { checkInTime: '09:00', checkOutTime: '18:00' },
      { checkInTime: '09:00', checkOutTime: '18:00' },
      { checkInTime: '09:00', checkOutTime: '18:00' },
      { checkInTime: '09:00', checkOutTime: '18:00' },
      { checkInTime: '09:00', checkOutTime: '18:00' },
      { checkInTime: '09:00', checkOutTime: '18:00' },
    ],
  }),
}))

vi.mock('../../../features/calendar/model/EventsProvider', () => ({
  useEvents: () => ({
    getEventsByDate: () => [],
    events: [],
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
  }),
}))

vi.mock('../../../features/chat/model/ChatProvider', () => ({
  useChat: () => ({
    channels: [{ id: '1', name: '일반' }],
    activeChannelId: '1',
    getMessagesByChannel: () => [],
  }),
}))

vi.mock('../../../features/tasks/model/TasksProvider', () => ({
  useTasks: () => ({
    getTasksByDate: () => [],
    tasks: [],
    isLoading: false,
    toggleTaskDone: mockToggleTaskDone,
  }),
}))

vi.mock('../../../shared/lib/date', () => ({
  getTodayStr: () => '2026-03-23',
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

  it('오늘 일정 카드가 렌더링된다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByText('오늘 일정')).toBeInTheDocument()
  })

  it('출근 가능 IP 안내 문구가 표시된다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByText('출근은 220.69 대역 IP에서만 가능합니다.')).toBeInTheDocument()
  })

  it('일정이 없을 때 빈 상태 메시지를 표시한다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByText('오늘 등록된 일정이 없습니다')).toBeInTheDocument()
  })

  it('오늘 할 일 카드가 렌더링된다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(screen.getByText('오늘 할 일')).toBeInTheDocument()
  })

  it('채팅 미리보기 카드가 렌더링된다', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    // activeChannel name이 표시되거나 채팅 열기 링크가 있어야 함
    expect(screen.getByText('채팅 열기')).toBeInTheDocument()
  })
})
