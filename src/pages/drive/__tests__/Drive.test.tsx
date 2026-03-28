import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { driveHandlers, resetDriveMockData } from '../../../shared/api/mock/handlers/drive'
import { Drive } from '../index'

let mockCurrentUserTeam = 'AI'

vi.mock('../../../features/auth/model', () => ({
  useApp: () => ({
    state: {
      currentUser: { id: '3', name: '이멤버', role: 'MEMBER', team: mockCurrentUserTeam },
      users: [],
    },
    isAdmin: false,
    isTeamLead: false,
  }),
}))

// jsdom에서 URL.createObjectURL 미구현 → 스텁
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()

const server = setupServer(...driveHandlers)
beforeAll(() => server.listen())
beforeEach(() => {
  localStorage.clear()
  resetDriveMockData()
  mockCurrentUserTeam = 'AI'
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Drive 페이지', () => {
  it('드라이브 안내 문구가 렌더링된다', () => {
    render(<Drive />)
    expect(screen.getByText('모든 멤버가 함께 쓰는 공용 문서함입니다. 업로드한 파일은 팀 전체가 바로 확인할 수 있습니다.')).toBeInTheDocument()
  })

  it('신입이 아닌 일반 멤버에게도 공용 업로드 버튼이 표시된다', () => {
    render(<Drive />)
    expect(screen.getByRole('button', { name: '공용 파일 업로드' })).toBeInTheDocument()
    expect(screen.getByText('일반 멤버, 팀장, 관리자 모두 같은 공유 드라이브를 사용합니다.')).toBeInTheDocument()
  })

  it('신입 팀은 업로드 버튼이 비활성화된다', () => {
    mockCurrentUserTeam = '신입'

    render(<Drive />)

    expect(screen.getAllByRole('button', { name: '신입 팀은 업로드 불가' })).toHaveLength(2)
    screen.getAllByRole('button', { name: '신입 팀은 업로드 불가' }).forEach((button) => {
      expect(button).toBeDisabled()
    })
    expect(screen.getByText('신입 팀은 공유 드라이브를 조회만 할 수 있고 파일 업로드는 제한됩니다.')).toBeInTheDocument()
  })

  it('업로드 버튼이 렌더링된다', () => {
    render(<Drive />)
    expect(screen.getByRole('button', { name: /업로드/ })).toBeInTheDocument()
  })

  it('파일 목록을 로드하면 파일명이 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      expect(screen.getByText('프로젝트 기획서.pdf')).toBeInTheDocument()
    })
  })

  it('파일 목록에 다운로드 버튼이 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      const downloadBtns = screen.getAllByTitle('다운로드')
      expect(downloadBtns.length).toBeGreaterThan(0)
    })
  })

  it('파일 목록에 삭제 버튼이 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      const deleteBtns = screen.getAllByTitle('삭제')
      expect(deleteBtns.length).toBeGreaterThan(0)
    })
  })

  it('파일 로드 후 요약 카드에 총 파일 수가 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      expect(screen.getByText('총 파일')).toBeInTheDocument()
      expect(screen.getByText('3개')).toBeInTheDocument()
    })
  })
})
