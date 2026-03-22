import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { AppProvider } from '../../../../features/auth/model'
import { PrivateRoute } from '../PrivateRoute'

const server = setupServer(
  http.get('/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) {
      return HttpResponse.json({ code: 'UNAUTHORIZED', message: '인증 필요', data: null }, { status: 401 })
    }
    return HttpResponse.json({
      code: 'SUCCESS', message: 'ok',
      data: { id: '1', name: '테스터', email: 'test@yanus.kr', team: 'BACKEND', role: 'MEMBER' },
    })
  }),
)

beforeAll(() => server.listen())
afterEach(() => { server.resetHandlers(); localStorage.clear() })
afterAll(() => server.close())

function renderPrivateRoute(hasToken: boolean) {
  if (hasToken) {
    localStorage.setItem('accessToken', 'mock-token-1')
  }

  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>대시보드</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('PrivateRoute', () => {
  it('토큰이 없으면 /login으로 리다이렉트된다', async () => {
    renderPrivateRoute(false)
    await waitFor(() => expect(screen.getByText('로그인 페이지')).toBeInTheDocument())
    expect(screen.queryByText('대시보드')).not.toBeInTheDocument()
  })

  it('토큰이 있으면 자식 컴포넌트가 렌더링된다', async () => {
    renderPrivateRoute(true)
    await waitFor(() => expect(screen.getByText('대시보드')).toBeInTheDocument())
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument()
  })
})
