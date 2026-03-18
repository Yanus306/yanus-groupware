import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from '../PrivateRoute'

function renderPrivateRoute(hasToken: boolean) {
  if (hasToken) {
    localStorage.setItem('accessToken', 'test-token')
  } else {
    localStorage.removeItem('accessToken')
  }

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<div>대시보드</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('토큰이 없으면 /login으로 리다이렉트된다', () => {
    renderPrivateRoute(false)
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
    expect(screen.queryByText('대시보드')).not.toBeInTheDocument()
  })

  it('토큰이 있으면 자식 컴포넌트가 렌더링된다', () => {
    renderPrivateRoute(true)
    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument()
  })
})
