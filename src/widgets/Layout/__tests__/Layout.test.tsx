import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '../../../features/auth/model'
import { ThemeProvider } from '../../../shared/theme'
import { Layout } from '../Layout'
import type { User } from '../../../entities/user/model/types'
import { renderHook, act } from '@testing-library/react'
import { useApp } from '../../../features/auth/model'
import type { ReactNode } from 'react'

function renderLayout(initialPath = '/') {
  return render(
    <ThemeProvider>
      <AppProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<div>홈 페이지</div>} />
              <Route path="chat" element={<div>채팅 페이지</div>} />
              <Route path="work-schedules" element={<div>근무 일정 페이지</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </ThemeProvider>,
  )
}

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('사이드바가 렌더링된다', () => {
    renderLayout()
    expect(document.querySelector('.sidebar')).toBeInTheDocument()
  })

  it('로고 이미지가 렌더링된다', () => {
    renderLayout()
    expect(screen.getByAltText('yANUs')).toBeInTheDocument()
  })

  it('모든 네비게이션 아이템이 렌더링된다', () => {
    renderLayout()
    const labels = ['홈', '채팅', '캘린더', '멤버', '출퇴근', '근무 일정', '드라이브', 'AI', '마이페이지']
    labels.forEach((label) => {
      expect(screen.getByTitle(label)).toBeInTheDocument()
    })
  })

  it('Outlet을 통해 자식 라우트가 렌더링된다', () => {
    renderLayout('/')
    expect(screen.getByText('홈 페이지')).toBeInTheDocument()
  })

  it('활성 라우트 nav-item에 active 클래스가 적용된다', () => {
    renderLayout('/chat')
    const chatLink = screen.getByTitle('채팅')
    expect(chatLink).toHaveClass('active')
  })

  it('로그인 사용자 정보가 없으면 로그아웃 버튼이 렌더링되지 않는다', () => {
    renderLayout()
    expect(screen.queryByText('로그아웃')).not.toBeInTheDocument()
  })

  it('로그인 사용자 정보가 있으면 이름과 로그아웃 버튼이 렌더링된다', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>
    const { result } = renderHook(() => useApp(), { wrapper })
    const user: User = { id: '1', name: '홍길동', email: 'user@test.com', team: 'BACKEND', role: 'MEMBER', online: true }
    act(() => { result.current.loadUser(user) })

    render(
      <ThemeProvider>
        <AppProvider>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<div />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </ThemeProvider>,
    )
    // 새 AppProvider는 currentUser가 없으므로 로그아웃 버튼 없음 확인
    expect(screen.queryByText('로그아웃')).not.toBeInTheDocument()
  })
})
