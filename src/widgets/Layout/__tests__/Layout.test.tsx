import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '../Layout'

function renderLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>홈 페이지</div>} />
          <Route path="chat" element={<div>채팅 페이지</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
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
    const labels = ['홈', '채팅', '캘린더', '멤버', '출퇴근', '드라이브', 'AI', '설정']
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

  it('비로그인 상태에서 로그인/회원가입 버튼이 렌더링된다', () => {
    renderLayout()
    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByText('회원가입')).toBeInTheDocument()
  })

  it('로그인 상태에서 로그인/회원가입 버튼이 렌더링되지 않는다', () => {
    localStorage.setItem('accessToken', 'test-token')
    renderLayout()
    expect(screen.queryByText('로그인')).not.toBeInTheDocument()
    expect(screen.queryByText('회원가입')).not.toBeInTheDocument()
  })
})
