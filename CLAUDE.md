# 🏢 yANUs Groupware Frontend — CLAUDE.md

> AI가 이 프로젝트에서 작업하기 전 반드시 읽어야 하는 설계 문서.
> 모든 구현은 이 문서를 기준으로 한다.
> 설계 밖의 임의 판단은 허용되지 않는다.
> **개발하라고 하기 전까지는 코드를 짜지마. 일단 계획부터 확인한다.**

---

## 0️⃣ 개발 철학 (Development Philosophy)

### ✅ 반드시 TDD로 개발한다

이 프로젝트는 **Test-Driven Development (TDD)** 방식으로만 개발한다.

#### 개발 순서 (절대 변경 금지)

1. 실패하는 테스트 작성 (**RED**)
2. 테스트 통과를 위한 최소 구현 (**GREEN**)
3. 리팩토링 (**REFACTOR**)
4. 다시 테스트 통과 확인

```
RED → GREEN → REFACTOR
```

#### 규칙

- 기능 코드 작성 전에 반드시 테스트를 먼저 작성한다.
- 테스트가 없는 기능은 존재할 수 없다.
- 테스트 없이 커밋 금지.
- 버그 수정도 동일하게: 재현 테스트 → 수정 → 통과.
- 비동기 로직은 성공/실패 케이스 모두 테스트한다.

#### 테스트 도구

- **Vitest**
- **React Testing Library**
- **MSW** (API Mocking 권장)

---

## 1️⃣ 아키텍처 패턴 — FSD (Feature-Sliced Design)

이 프로젝트는 **FSD(Feature-Sliced Design)** 패턴을 따른다.
UI 중심이 아닌 **기능 중심 구조**를 따른다.

### 📌 계층 구조

```
src/
├── app/
├── pages/
├── widgets/
├── features/
├── entities/
└── shared/
```

### 각 레이어 역할

| 레이어 | 역할 |
|--------|------|
| `app/` | Router 설정, 전역 Provider 조합, 전역 스타일 |
| `pages/` | 라우트 단위 진입점. 비즈니스 로직 없음. widget 조합만 함 |
| `widgets/` | 화면 구성 단위. Layout, StickyChatWidget 등 |
| `features/` | 실제 기능 로직. Context(상태), hook, API 호출, 기능 전용 컴포넌트 |
| `entities/` | 도메인 모델, 타입 정의 (User, Task, ChatMessage 등) |
| `shared/` | 공통 UI 컴포넌트, API 클라이언트, 유틸 함수 |

### 📁 상세 디렉토리 구조

```
src/
├── app/
│   ├── providers.tsx          # 모든 Provider 조합
│   ├── router.tsx             # BrowserRouter + Routes 정의
│   └── styles/
│       └── index.css          # 전역 스타일
│
├── pages/
│   ├── dashboard/index.tsx
│   ├── chat/index.tsx
│   ├── calendar/index.tsx
│   ├── attendance/index.tsx
│   ├── drive/index.tsx
│   ├── ai-chat/index.tsx
│   ├── members/index.tsx
│   └── settings/index.tsx
│
├── widgets/
│   ├── layout/
│   │   ├── ui/
│   │   │   ├── Layout.tsx
│   │   │   └── Layout.css
│   │   └── index.ts
│   └── sticky-chat/
│       ├── ui/
│       │   ├── StickyChatWidget.tsx
│       │   └── StickyChatWidget.css
│       └── index.ts
│
├── features/
│   ├── auth/
│   │   └── model/
│   │       └── store.ts       # 유저 인증 Context (AppContext)
│   ├── chat/
│   │   └── model/
│   │       └── store.ts       # 채팅 Context (ChatContext)
│   ├── calendar/
│   │   └── model/
│   │       └── store.ts       # 캘린더 이벤트 Context (EventsContext)
│   ├── tasks/
│   │   └── model/
│   │       └── store.ts       # 태스크 Context (TasksContext)
│   ├── attendance/
│   │   ├── model/
│   │   │   └── useWorkSession.ts  # 출퇴근 localStorage hook
│   │   └── ui/
│   │       ├── AnimatedClockRing.tsx
│   │       ├── ClockTimePicker.tsx
│   │       ├── ClockTimePicker.css
│   │       ├── SetWorkDaysPersonal.tsx
│   │       └── SetWorkDaysPersonal.css
│   └── ai-chat/
│       └── api/
│           └── aiClient.ts    # AI API 호출 (fetch 추상화)
│
├── entities/
│   ├── user/
│   │   └── model/types.ts     # User, UserRole, Team, PersonalWorkSchedule
│   ├── message/
│   │   └── model/types.ts     # ChatMessage, Channel
│   ├── event/
│   │   └── model/types.ts     # CalendarEvent
│   └── task/
│       └── model/types.ts     # Task, TaskPriority
│
└── shared/
    ├── api/
    │   ├── baseClient.ts      # fetch 추상화, 공통 헤더, 에러 처리
    │   └── mock/              # MSW mock handlers
    ├── ui/
    │   └── TimeInput/
    │       ├── TimeInput.tsx
    │       └── TimeInput.css
    └── lib/
        └── date.ts            # formatDateDisplay, getTodayStr 등 유틸
```

### ❌ FSD 금지 사항

- `pages`에서 API 직접 호출 금지
- `pages`에서 비즈니스 로직 작성 금지 (widget/feature 위임)
- `features` 간 직접 의존 금지
- 상위 레이어가 하위 레이어를 import 금지 (app > pages > widgets > features > entities > shared)
- 순환 참조 절대 금지
- `fetch` 직접 호출 금지 (반드시 `shared/api/baseClient` 경유)
- `any` 타입 금지

---

## 2️⃣ 프로젝트 개요

**yANUs**는 동아리 그룹웨어다.
React PWA 기반으로 웹과 모바일에서 모두 사용 가능하다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| 업무 채팅 | 채널 및 다이렉트 메시지 |
| 출퇴근 | 출근/퇴근 기록, 개인 스케줄 설정 |
| Set Work Days | 출/퇴근 시간, 근무 요일 본인 계정으로만 수정 |
| 관리자 기능 | 팀장/리더가 출퇴근 기록 열람 |
| 파일 드라이브 | 폴더/파일 공유 |
| AI 챗봇 | 파일 드라이브 기반 질의응답 |
| Sticky 위젯 | 웹 화면 어디서든 우측 하단에서 채팅/챗봇 접근 가능 |

---

## 3️⃣ 기술 스택

| 분류 | 기술 |
|------|------|
| UI | React 19 |
| 언어 | TypeScript 5 |
| 번들러 | Vite |
| 스타일 | CSS (컴포넌트별 .css 파일) |
| 상태 관리 | React Context API |
| 라우팅 | React Router v7 |
| 캘린더 | FullCalendar v6 |
| 애니메이션 | framer-motion |
| 아이콘 | lucide-react |
| 마크다운 | react-markdown + remark-breaks |
| 테스트 | Vitest + React Testing Library + MSW |
| PWA | vite-plugin-pwa |

---

## 4️⃣ API 통신 규칙

모든 API 호출은 `shared/api/baseClient.ts`를 통해서만 작성한다.

```
shared/api/
├── baseClient.ts      # 공통 클라이언트
├── aiClient.ts        # (features/ai-chat/api/aiClient.ts 참조)
└── mock/              # MSW handlers
```

#### 공통 처리 (baseClient 책임)

- baseURL 적용
- JSON 파싱
- 401 자동 로그아웃
- `Authorization` 헤더 자동 추가
- 에러 표준화

---

## 5️⃣ 인증 및 권한 가드

### 토큰 저장

- `localStorage` 사용

### 라우트 가드

| 가드 | 조건 |
|------|------|
| `PrivateRoute` | 로그인 필요 |
| `AdminRoute` | `role === 'leader' \| 'team_lead'` 필요 |

### 401 발생 시

1. `accessToken` 제거
2. 로그인 페이지 리다이렉트

---

## 6️⃣ 상태 관리 원칙

**Context는 feature 단위로 분리한다.**

```
features/auth/model/store.ts     # AppContext
features/chat/model/store.ts     # ChatContext
features/calendar/model/store.ts # EventsContext
features/tasks/model/store.ts    # TasksContext
```

- 하나의 거대한 Context 금지
- Context는 관련 feature 도메인만 담당

---

## 7️⃣ 디자인 원칙

- 컴포넌트별 CSS 파일 사용 (`Component.css`)
- 임의 인라인 스타일 지양
- **다크 테마 기본**
- `hover` / `focus` / `transition` 필수
- 모바일 반응형 필수 (PWA이므로)

---

## 8️⃣ Mock 전략

백엔드 미완성 시 반드시 Mock 사용

```
shared/api/mock/
```

환경 변수:

```
VITE_USE_MOCK=true
```

- Mock 없이 API 개발 금지.

---

## 9️⃣ AngularJS Commit Convention (반드시 준수)

이 프로젝트는 **AngularJS Commit Convention**을 따른다.

### 기본 형식

```
<type>(<scope>): <subject>
```

### type 목록

| type | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷 변경 |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드/설정 변경 |

### 규칙

- `subject`는 50자 이내
- 마침표 사용 금지
- `type` 생략 금지
- `scope` 생략 금지

### 커밋 메시지 / PR 작성 원칙

- **로컬 개발 환경 관련 내용 커밋 메시지·PR 본문에 노출 금지**
  - 예: `127.0.0.1`, `localhost`, 포트 번호, preview tool 연결 이슈 등
- 커밋/PR은 **기능의 목적과 이유** 중심으로 작성한다
- **`Co-Authored-By` 절대 금지** — 모든 커밋은 본인 계정(jyt6640)으로만 기록한다
- **커밋 메시지·PR 제목·이슈 제목은 `type(scope):` 형식(네이밍)을 제외하고 모두 한글로 작성한다 (절대 영문 금지)**
  - `type(scope):` 부분은 AngularJS convention 영문 유지
  - 이후 설명(subject)과 본문(body)은 반드시 한글로 작성

**올바른 예시**
```
feat(chat): 채널 메시지 전송 기능 구현
test(attendance): 출퇴근 기록 테스트 작성
fix(auth): 로그인 리다이렉트 버그 수정
refactor(entities): 도메인 타입 entities 레이어로 분리
```

**잘못된 예시**
```
feat(chat): implement channel message sending  ← 영문 설명 금지
feat(ui): add Button, Input, Badge components  ← 여러 기능 묶음 금지
```

---

## 🔟 이슈 관리 규칙

### 이슈 제목 형식

이슈 제목도 **AngularJS Commit Convention**을 따른다.

```
<type>(<scope>): <설명 (한글)>
```

**예시**
```
refactor(arch): FSD 디렉토리 초기 구조 세팅
refactor(entities): 도메인 타입 entities 레이어로 분리
feat(chat): 채널 메시지 전송 기능 구현
test(auth): 인증 로직 단위 테스트 작성
chore(test): Vitest + RTL + MSW 테스트 환경 세팅
```

### 이슈-브랜치-PR 연결 규칙

1. **이슈 먼저 생성** → 이슈 번호 확인
2. **브랜치 생성** 시 이슈 번호 포함:
   ```
   feature/<scope>-<작업명>  (예: feature/arch-fsd-setup)
   ```
3. **커밋 메시지**에 이슈 번호 참조:
   ```
   refactor(arch): FSD 디렉토리 초기 구조 세팅 (#1)
   ```
4. **PR 본문**에 `closes #N` 또는 `관련 이슈: #N` 포함
5. `develop` 대상 PR은 자동 close 안 되므로 **수동으로 직접 닫는다**
6. 이슈 close 시 완료 사유 코멘트 필수

### 이슈 라벨

| 라벨 | 용도 |
|------|------|
| `feat` | 새 기능 |
| `refactor` | 리팩토링 |
| `fix` | 버그 수정 |
| `test` | 테스트 |
| `chore` | 설정/빌드 |
| `docs` | 문서 |

### 이슈 관리 원칙

- **구현이 완료된 이슈는 즉시 close한다** — 브랜치 작업 완료 시점에 바로 닫는다
- 하나의 이슈 = 하나의 기능 단위 (커밋 단위 원칙과 동일)
- 이슈 없이 PR 금지

---

## 1️⃣1️⃣ 브랜치 전략 (GitHub Flow 기반)

### 브랜치 구조

```
main
└── develop
    ├── feature/arch-fsd-setup
    ├── feature/chat-channel
    ├── feature/attendance-record
    └── fix/auth-token-refresh
```

### 브랜치 종류

| 브랜치 | 생성 기준 | 머지 대상 | 설명 |
|--------|-----------|-----------|------|
| `main` | - | - | 프로덕션 배포 브랜치 |
| `develop` | `main`에서 분기 | `main` | 통합 개발 브랜치. 모든 feature의 기준점 |
| `feature/<scope>-<작업명>` | `develop`에서 분기 | `develop` | 기능 단위 개발 |
| `fix/<scope>-<버그명>` | `develop`에서 분기 | `develop` | 일반 버그 수정 |
| `hotfix/<이슈명>` | `main`에서 분기 | `main` + `develop` | 프로덕션 긴급 수정 |

### PR 규칙

- `feature/*` → `develop` : PR 필수, 셀프 머지 가능 (1인 개발 시)
- `develop` → `main` : PR 필수, 테스트 전체 통과 후 머지
- `hotfix/*` → `main` 머지 후 반드시 `develop`에도 반영
- PR 제목은 **AngularJS Commit Convention** 형식 준수
- 머지 전 `npm run test` 통과 필수
- 머지 전 **브라우저에서 실제 렌더링 확인 필수**
- **머지는 항상 본인(jyt6640)이 직접 한다**

### 커밋 단위 원칙 (절대 준수)

- **커밋은 반드시 가장 작은 기능 단위로 한다.**
- 하나의 커밋 = 하나의 기능 (컴포넌트 1개, 함수 1개, 테스트 1세트)
- 여러 기능을 묶어서 한 번에 커밋 금지
- **테스트 코드와 구현 코드는 반드시 별도 커밋으로 분리한다**
  - `test(scope): ...` 커밋 → `feat(scope): ...` 커밋 순서로 작성 (TDD RED→GREEN 반영)
- 리팩토링은 별도 커밋으로 분리

**커밋 순서 예시 (TDD 흐름)**
```
test(entities): User 타입 테스트 작성
refactor(entities): User 타입 entities 레이어로 분리
test(features): auth Context 테스트 작성
refactor(features): AppContext features/auth 레이어로 이동
```

### 금지 사항

- `main` 직접 push 금지
- 테스트 실패 상태로 머지 금지
- 하나의 브랜치에 여러 기능 혼재 금지
- 브랜치명에 한글 사용 금지

---

## 1️⃣2️⃣ 개발 단계

| Phase | 이슈 | 작업 내용 |
|-------|------|-----------|
| **Phase 1** | #1~#8 | FSD 구조 리팩토링 (현재 코드 → FSD 구조로 이전) |
| **Phase 2** | #9~ | Vitest + RTL + MSW 테스트 환경 세팅 |
| **Phase 3** | | 인증(auth) 기능, PrivateRoute / AdminRoute 구현 |
| **Phase 4** | | 채팅 기능 고도화 (채널, DM, 실시간) |
| **Phase 5** | | 출퇴근 기능 고도화, 관리자 열람 |
| **Phase 6** | | 파일 드라이브, AI 챗봇 고도화 |

### Phase 1 세부 이슈 목록

| 이슈 번호 | 제목 | 브랜치 |
|-----------|------|--------|
| #1 | `chore(arch): FSD 디렉토리 초기 구조 세팅` | `feature/arch-fsd-setup` |
| #2 | `refactor(entities): 도메인 타입 entities 레이어로 분리` | `feature/entities-domain-types` |
| #3 | `refactor(shared): 공통 유틸 및 UI shared 레이어로 분리` | `feature/shared-utils-ui` |
| #4 | `refactor(features): Context 기능 로직 features 레이어로 분리` | `feature/features-context-migration` |
| #5 | `refactor(widgets): Layout, StickyChatWidget widgets 레이어로 분리` | `feature/widgets-layout-sticky` |
| #6 | `refactor(app): Provider, Router app 레이어로 이동` | `feature/app-providers-router` |
| #7 | `refactor(pages): 각 페이지 컴포넌트 pages 레이어로 정리` | `feature/pages-fsd-cleanup` |
| #8 | `refactor(features): AI 챗봇 fetch 호출 API 클라이언트로 추상화` | `feature/features-ai-client` |

---

## 🔥 최종 핵심 원칙

- 브랜치 전략 위반 금지 (`main` 직접 push 금지)
- **이슈 없이 PR 금지**
- TDD 없이 기능 작성 금지
- FSD 레이어 규칙 위반 금지 (상위 → 하위 import만 허용)
- `fetch` 직접 호출 금지 (`shared/api/baseClient` 경유)
- `any` 타입 금지
- Mock 없이 API 개발 금지
- AngularJS Commit Convention 반드시 준수
- **커밋 메시지 subject는 반드시 한글 (type(scope): 제외)**
- **머지는 항상 본인(jyt6640)이 직접 한다**
