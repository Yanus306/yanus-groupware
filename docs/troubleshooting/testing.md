# 테스트 트러블슈팅

---

## RTL — `Found multiple elements with role button and name ''`

**발생 시점**: StickyChatWidget 테스트 작성 시

### 증상

```
TestingLibraryElementError: Found multiple elements with the role "button" and name ""
```

### 원인

화면에 이름(accessible name)이 없는 `<button>` 이 여러 개 있을 때 `getByRole('button')` 사용.

### 해결

```tsx
// ❌ 이름 없는 button이 여러 개면 실패
screen.getByRole('button')

// ✅ name으로 특정
screen.getByRole('button', { name: '전송' })

// ✅ 또는 class로 직접 선택
container.querySelector('.send-btn') as HTMLElement
```

aria-label을 추가하면 접근성도 개선됩니다.

```tsx
<button aria-label="메시지 전송" className="send-btn">
  <Send size={20} />
</button>
```

---

## RTL — `Found multiple elements with text /yANUs Assistant/`

**발생 시점**: StickyChatWidget 테스트 작성 시

### 증상

```
TestingLibraryElementError: Found multiple elements with the text: /yANUs Assistant/
```

### 원인

정규식으로 텍스트 검색 시 부분 일치로 여러 요소가 매칭됨.

### 해결

```tsx
// ❌ 정규식 — 부분 일치로 여러 개 매칭
screen.getByText(/yANUs Assistant/)

// ✅ 정확한 문자열 사용
screen.getByText('yANUs Assistant')

// ✅ 또는 querySelector로 특정 컨테이너에서 검색
container.querySelector('.chat-msg')?.textContent
```

---

## Vitest — `localStorage is not defined`

### 증상

```
ReferenceError: localStorage is not defined
```

### 원인

Vitest 기본 환경이 `node`로 설정되어 있어 브라우저 API 없음.

### 해결

`vite.config.ts` 또는 `vitest.config.ts`에 jsdom 환경 설정:

```ts
// vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'

// 각 테스트 전후 localStorage 초기화
beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})
```

---

## Vitest — 비동기 상태 업데이트가 반영되지 않음

### 증상

```
expect(received).toBe(expected)
Expected: true
Received: false
```

### 원인

상태 업데이트가 `act()` 없이 발생하여 React가 업데이트를 처리하지 않음.

### 해결

```tsx
import { act } from '@testing-library/react'

// ❌ act 없이 상태 변경
result.current.clockIn()
expect(result.current.status).toBe('working') // 실패 가능

// ✅ act로 감싸기
act(() => {
  result.current.clockIn()
})
expect(result.current.status).toBe('working')
```

비동기 작업의 경우:

```tsx
await act(async () => {
  await result.current.login('test@test.com', 'password')
})
```

---

## Vitest — `Cannot find module` (경로 별칭)

### 증상

```
Error: Cannot find module '@/features/auth/model'
```

### 원인

`vite.config.ts`에 경로 별칭이 설정되어 있지 않거나,
테스트 환경에서 별칭이 적용되지 않음.

### 해결

현재 프로젝트는 경로 별칭을 사용하지 않고 상대 경로를 사용합니다.

```ts
// ✅ 상대 경로 사용
import { useApp } from '../../../features/auth/model'
```
