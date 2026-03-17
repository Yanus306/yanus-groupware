# 테스트 가이드

## TDD 원칙

이 프로젝트는 **TDD(Test-Driven Development)** 방식으로만 개발합니다.

```
RED → GREEN → REFACTOR
```

1. **RED**: 실패하는 테스트 먼저 작성
2. **GREEN**: 테스트 통과를 위한 최소 구현
3. **REFACTOR**: 코드 정리, 다시 테스트 통과 확인

---

## 테스트 실행

```bash
# watch 모드 (개발 중)
npm run test

# 단일 실행 (CI/커밋 전)
npm run test:run

# 특정 파일만
npm run test -- src/features/auth
```

---

## 파일 위치 규칙

테스트 파일은 대상 파일과 같은 레이어에 `__tests__/` 폴더 안에 위치합니다.

```
src/features/auth/model/
├── AppProvider.tsx
└── __tests__/
    └── AppProvider.test.tsx
```

---

## 단위 테스트 작성법

### Context Provider 테스트

```tsx
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useApp } from '../AppProvider'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
)

describe('AppProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('초기 상태에서 user는 null이다', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('setUser 호출 시 user가 업데이트된다', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.setUser({ id: '1', name: 'test', role: 'USER' })
    })
    expect(result.current.user?.name).toBe('test')
  })
})
```

### API 함수 테스트 (fetch mock)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendChatMessage } from '../aiClient'

describe('sendChatMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('성공 응답에서 message.content를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'AI 응답' } }),
    }))
    const result = await sendChatMessage([], '질문', 'http://localhost:11434', 'llama3.1')
    expect(result).toBe('AI 응답')
  })

  it('HTTP 에러 시 에러 메시지를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const result = await sendChatMessage([], '질문', 'http://localhost:11434', 'llama3.1')
    expect(result).toContain('통신할 수 없습니다')
  })
})
```

### 컴포넌트 테스트 (React Testing Library)

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Layout } from '../Layout'

describe('Layout', () => {
  it('네비게이션 메뉴가 렌더링된다', () => {
    render(<Layout><div>content</div></Layout>)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('로그아웃 버튼 클릭 시 onLogout이 호출된다', async () => {
    const onLogout = vi.fn()
    render(<Layout onLogout={onLogout}><div /></Layout>)
    await userEvent.click(screen.getByRole('button', { name: /로그아웃/ }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
```

---

## MSW를 활용한 통합 테스트

MSW 설치 후(#30 이슈) 아래와 같이 사용합니다.

```tsx
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.post('/auth/login', () => {
    return HttpResponse.json({ accessToken: 'fake-token' })
  }),
  http.get('/auth/me', () => {
    return HttpResponse.json({ id: '1', name: '홍길동', role: 'USER' })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('로그인 후 대시보드로 이동한다', async () => {
  render(<App />)
  await userEvent.type(screen.getByLabelText('이메일'), 'test@test.com')
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password')
  await userEvent.click(screen.getByRole('button', { name: '로그인' }))
  expect(await screen.findByText('Dashboard')).toBeInTheDocument()
})
```

---

## 자주 하는 실수

### localStorage가 테스트 간 오염

```ts
// ❌ 이전 테스트의 localStorage 값이 남음
it('...', () => { ... })

// ✅ beforeEach에서 항상 초기화
beforeEach(() => {
  localStorage.clear()
})
```

### 비동기 상태 업데이트 누락

```tsx
// ❌ act 없이 상태 변경
result.current.login('token')
expect(result.current.isLoggedIn).toBe(true) // 실패할 수 있음

// ✅ act로 감싸기
act(() => {
  result.current.login('token')
})
expect(result.current.isLoggedIn).toBe(true)
```

### 여러 같은 역할 요소 선택 실패

```tsx
// ❌ 여러 button이 있으면 실패
screen.getByRole('button')

// ✅ name으로 특정
screen.getByRole('button', { name: '전송' })

// ✅ 또는 className으로 querySelector
container.querySelector('.send-btn')
```
