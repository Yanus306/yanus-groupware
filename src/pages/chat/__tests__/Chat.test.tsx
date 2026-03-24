import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chat } from '../index'

const mockSetActiveChannelId = vi.fn()
const mockAddMessage = vi.fn()

window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '1', name: '김리더', role: 'ADMIN', team: 'BACKEND' },
      users: [
        { id: '1', name: '김리더', role: 'ADMIN', team: 'BACKEND', email: 'admin@yanus.kr', status: 'ACTIVE', online: true },
        { id: '2', name: '박팀장', role: 'TEAM_LEAD', team: 'FRONTEND', email: 'lead@yanus.kr', status: 'ACTIVE', online: true },
        { id: '5', name: '비활성멤버', role: 'MEMBER', team: 'SECURITY', email: 'inactive@yanus.kr', status: 'INACTIVE', online: false },
      ],
    },
    loadMembers: vi.fn(),
  }),
}))

vi.mock('../../../features/chat/model', () => ({
  useChat: () => ({
    channels: [
      { id: '1', name: 'General', lastMessage: '안녕하세요!' },
      { id: '2', name: 'Design Team', lastMessage: '디자인 피드백 부탁드려요' },
    ],
    activeChannelId: '1',
    setActiveChannelId: mockSetActiveChannelId,
    addMessage: mockAddMessage,
    getMessagesByChannel: () => [],
  }),
}))

vi.mock('../../../shared/api/membersApi', () => ({
  getMembers: vi.fn(),
}))

describe('Chat 페이지', () => {
  it('개인 대화 목록에서 비활성 멤버를 숨긴다', () => {
    render(<Chat />)

    expect(screen.getByText('박팀장')).toBeInTheDocument()
    expect(screen.queryByText('비활성멤버')).not.toBeInTheDocument()
  })
})
