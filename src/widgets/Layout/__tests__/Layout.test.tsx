import { describe, it, expect } from 'vitest'
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
})
