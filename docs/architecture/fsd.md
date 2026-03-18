# FSD (Feature-Sliced Design) 아키텍처

## 개요

yANUs는 **FSD(Feature-Sliced Design)** 패턴을 따릅니다.
UI 중심이 아닌 **기능 중심**으로 코드를 분리하여 유지보수성과 확장성을 높입니다.

## 레이어 구조

```
src/
├── app/          ← 앱 진입점, Provider, Router
├── pages/        ← 라우트 단위 화면 (비즈니스 로직 없음)
├── widgets/      ← 독립적인 화면 블록
├── features/     ← 기능 로직, 상태 관리, API 호출
├── entities/     ← 도메인 타입 정의
└── shared/       ← 공통 유틸, UI, API 클라이언트
```

## 레이어별 역할

### `app/`
- `providers.tsx` — 전역 Context Provider 조합
- `router.tsx` — BrowserRouter + 모든 Route 정의
- 라우트 가드(PrivateRoute, AdminRoute) 적용

### `pages/`
- 라우트 단위 컴포넌트만 담당
- **비즈니스 로직 금지** — API 직접 호출 금지
- widget 조합 + 레이아웃만 담당

```tsx
// ✅ 올바른 pages 사용
export function DashboardPage() {
  return (
    <div>
      <AttendanceWidget />
      <ScheduleWidget />
    </div>
  )
}

// ❌ 잘못된 사용 — API 직접 호출
export function DashboardPage() {
  const data = await fetch('/api/dashboard') // 금지!
}
```

### `widgets/`
- 독립적으로 동작하는 화면 구성 블록
- 현재: `Layout`, `StickyChatWidget`

### `features/`
- 실제 기능 로직이 위치하는 레이어
- Context Provider, 커스텀 훅, API 호출 함수

```
features/
├── auth/model/          AppProvider (사용자 상태)
├── chat/model/          ChatProvider (채팅 상태)
├── calendar/model/      EventsProvider (이벤트 상태)
├── tasks/model/         TasksProvider (할일 상태)
├── attendance/
│   ├── model/           useWorkSession 훅
│   └── ui/              출퇴근 관련 UI 컴포넌트
└── ai-chat/api/         aiClient (Ollama API 통신)
```

### `entities/`
- 도메인 모델 타입 정의만 담당
- 로직 없음, 타입만 존재

```
entities/
├── user/model/types.ts      User, UserRole
├── message/model/types.ts   Message
├── task/model/types.ts      Task, TaskStatus
└── event/model/types.ts     CalendarEvent
```

### `shared/`
- 도메인에 종속되지 않는 공통 코드

```
shared/
├── api/baseClient.ts    fetch 추상화, 401 처리
├── lib/date.ts          날짜 유틸 함수
└── ui/TimeInput/        공통 UI 컴포넌트
```

## 의존 규칙

```
app → pages → widgets → features → entities → shared
```

- **상위 레이어만 하위 레이어를 import**할 수 있다
- 같은 레이어 간 직접 의존 금지
- 순환 참조 절대 금지

### 위반 예시

```tsx
// ❌ features에서 pages import — 상위 레이어 import 금지
import { Dashboard } from '../../pages/dashboard'

// ❌ features/chat에서 features/auth 직접 import — 같은 레이어 금지
// (useApp은 features/auth에 있음)
// 대신 shared를 통하거나 Context를 통해 접근
```

## 하위 호환 re-export

FSD 마이그레이션 과정에서 기존 import 경로를 유지하기 위해 re-export 파일을 사용합니다.

```tsx
// src/context/AppContext.tsx (re-export stub)
export { AppProvider, useApp } from '../features/auth/model/AppProvider'
```

실제 코드는 `features/`에 있고, 기존 `context/` 경로에서도 접근 가능합니다.
신규 코드는 반드시 `features/` 경로를 직접 사용하세요.
