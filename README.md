# yANUs — 동아리 그룹웨어

> React 19 + PWA 기반 동아리 전용 그룹웨어

[![CI](https://github.com/Yanus306/yanus-groupware/actions/workflows/ci.yml/badge.svg)](https://github.com/Yanus306/yanus-groupware/actions/workflows/ci.yml)

---

## 목차

- [소개](#소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [테스트](#테스트)
- [CI/CD](#cicd)
- [브랜치 전략](#브랜치-전략)

---

## 소개

**yANUs**는 동아리 운영에 필요한 모든 기능을 하나로 묶은 그룹웨어입니다.  
출퇴근 관리, 팀 채팅, 일정 관리, 파일 공유, AI 어시스턴트를 웹/모바일 어디서든 사용할 수 있습니다.

- PWA 지원 — 모바일 홈 화면에 앱처럼 설치 가능
- 다크 테마 기본 적용
- FSD(Feature-Sliced Design) 아키텍처 기반 구조화
- Vercel Speed Insights로 실사용자 성능 지표 수집

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **대시보드** | 오늘의 일정·채팅·출퇴근 현황을 한눈에 확인 |
| **업무 채팅** | 실시간 채널 및 다이렉트 메시지 |
| **캘린더** | FullCalendar 기반 일정·할일 관리 (내 할일/팀 할일 분리) |
| **출퇴근** | 출근·퇴근 기록, 근무 시간 시각화, 요일별 출퇴근 시간 개별 설정, 근무 일정 캘린더 반영 |
| **파일 드라이브** | 팀 파일·폴더 공유 |
| **AI 챗봇** | 파일 드라이브 기반 질의응답 (Ollama 호환 API) |
| **Sticky 위젯** | 모든 화면 우측 하단에서 채팅·챗봇 바로 접근 |
| **멤버 관리** | 팀별·역할별 필터링, 역할 변경, 활성/비활성 관리 |
| **관리자 대시보드** | 팀원 전체 출근 현황 (근무 중/퇴근/미출근 필터), 멤버 역할 관리 |
| **설정** | 프로필 편집, 알림 설정, 비밀번호 변경, 테마 설정 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| UI | React 19 |
| 언어 | TypeScript 5 |
| 번들러 | Vite 7 |
| 라우팅 | React Router v7 |
| 캘린더 | FullCalendar 6 |
| 애니메이션 | Framer Motion 12 |
| 아이콘 | Lucide React |
| 마크다운 | react-markdown |
| 스타일 | CSS (레이어별 모듈) |
| PWA | vite-plugin-pwa |
| 성능 모니터링 | Vercel Speed Insights |
| 테스트 | Vitest + React Testing Library + MSW |
| 배포 | Vercel |

---

## 아키텍처

이 프로젝트는 **FSD(Feature-Sliced Design)** 패턴을 따릅니다.  
UI 중심이 아닌 **기능 중심**으로 코드를 분리하여 유지보수성과 확장성을 높입니다.

```
app
 └─ Providers, Router 초기화

pages
 └─ 라우트 단위 화면 (비즈니스 로직 없음)

widgets
 └─ 화면을 구성하는 독립적인 블록

features
 └─ 실제 기능 로직, 상태 관리, API 호출

entities
 └─ 도메인 모델, 타입 정의

shared
 └─ 공통 UI, API 클라이언트, 유틸 함수
```

### 레이어 의존 규칙

- 상위 레이어만 하위 레이어를 import할 수 있습니다.
- `pages` → `widgets` → `features` → `entities` → `shared`
- 동일 레이어 간 직접 의존 금지, 순환 참조 금지

---

## 프로젝트 구조

```
src/
├── app/
│   ├── providers.tsx        # 전역 Provider 조합
│   ├── router.tsx           # BrowserRouter + Routes
│   └── index.ts
│
├── pages/
│   ├── dashboard/           # 대시보드 (출퇴근 카드, 할일, 채팅 미리보기)
│   ├── chat/                # 채팅
│   ├── calendar/            # 캘린더 (일정 + 내 할일/팀 할일)
│   ├── attendance/          # 출퇴근 (개인 기록 + 근무 일정 설정)
│   ├── drive/               # 파일 드라이브
│   ├── ai-chat/             # AI 챗봇
│   ├── members/             # 멤버 목록 (팀/역할 필터)
│   ├── admin/               # 관리자 대시보드 (출근 현황, 멤버 관리)
│   └── settings/            # 설정 (프로필, 알림, 테마, 보안)
│
├── widgets/
│   ├── Layout/              # 전체 레이아웃 (사이드바, GNB)
│   └── StickyChatWidget/    # 우측 하단 Sticky 위젯
│
├── features/
│   ├── auth/model/          # 앱 전역 사용자 상태 (AppProvider)
│   ├── chat/model/          # 채팅 상태 (ChatProvider)
│   ├── calendar/model/      # 캘린더 이벤트 상태 (EventsProvider)
│   ├── tasks/model/         # 할일 상태 (TasksProvider) — myTasks/teamTasks 분리
│   ├── attendance/
│   │   ├── model/           # useWorkSession, useWorkSchedule 훅
│   │   └── ui/              # AnimatedClockRing, SetWorkDaysPersonal, TeamAttendanceStatus
│   └── ai-chat/api/         # aiClient (Ollama API 통신 추상화)
│
├── entities/
│   ├── user/model/types.ts
│   ├── message/model/types.ts
│   ├── task/model/types.ts
│   └── event/model/types.ts
│
├── shared/
│   ├── api/baseClient.ts    # fetch 추상화, ApiError 처리
│   ├── lib/date.ts          # 날짜 유틸 함수
│   └── ui/TimeInput/        # 공통 시간 입력 컴포넌트
│
└── test/setup.ts            # Vitest 전역 설정
```

---

## 시작하기

### 요구 사항

- Node.js 20+
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 필요한 변수를 설정합니다.

```env
# true 설정 시 MSW Mock 핸들러 활성화 (chat, calendar, drive)
VITE_USE_MOCK=true

# AI 챗봇 API 서버 주소 (Ollama 호환 서버)
VITE_AI_API_URL=<your-ollama-api-url>

# 사용할 AI 모델명
VITE_AI_API_MODEL=llama3.1
```

> **백엔드 API 연동**  
> 로컬 개발 시 `vite.config.ts`의 proxy 설정을 통해 `/api` 요청을 백엔드 서버로 전달합니다.  
> `VITE_API_BASE_URL`은 Vercel 프로덕션 배포 환경에서만 주입합니다.

> **Mock 전략**  
> `auth`, `attendance`, `members` API는 실제 백엔드와 통신합니다.  
> `chat`, `calendar`, `drive`는 `VITE_USE_MOCK=true` 시 MSW로 모킹됩니다.

---

## 테스트

이 프로젝트는 **TDD(Test-Driven Development)** 방식으로 개발됩니다.  
기능 코드 작성 전 반드시 테스트를 먼저 작성합니다 (RED → GREEN → REFACTOR).

```bash
# 테스트 실행 (watch 모드)
npm run test

# 테스트 단일 실행 (CI용)
npm run test:run
```

### 테스트 현황

- **293개** 이상 테스트, **44개** 테스트 파일

```
features/ai-chat/api/         — aiClient 통신 로직
features/attendance/model/    — useWorkSession, useWorkSchedule 훅
features/attendance/ui/       — SetWorkDaysPersonal, TeamAttendanceStatus (상태 필터 포함)
features/auth/model/          — AppProvider 상태
features/chat/model/          — ChatProvider 상태
features/calendar/model/      — EventsProvider 상태
features/tasks/model/         — TasksProvider (myTasks/teamTasks 분리 포함)
pages/admin/                  — 관리자 대시보드
pages/attendance/             — 출퇴근 페이지
pages/settings/               — 설정 (비밀번호 변경 포함)
widgets/Layout/               — 레이아웃 렌더링
widgets/StickyChatWidget/     — Sticky 위젯 동작
shared/api/                   — 출퇴근, 태스크, 캘린더 API 클라이언트
shared/lib/                   — 날짜 유틸 함수
app/                          — Provider 조합
```

### API 모킹 규칙

- 비동기 API 테스트는 반드시 **MSW `setupServer`** 를 사용합니다.
- `vi.mock`으로 API 모듈을 직접 mock하는 것은 금지입니다.

---

## CI/CD

### CI — GitHub Actions

`develop`, `main` 브랜치 push 및 PR 시 자동 실행됩니다.

```
테스트 실행 (npm run test:run)
  ↓
빌드 검증 (npm run build)
```

### CD — Vercel

| 브랜치 | 배포 환경 |
|--------|-----------|
| `develop` | Preview |
| `main` | Production |

> Vercel 배포는 `VERCEL_TOKEN` secret 설정 시 활성화됩니다.

---

## 브랜치 전략

GitHub Flow 기반으로 운영됩니다.

```
main          ← 프로덕션 (Vercel 자동 배포)
  └─ develop  ← 통합 개발 (PR 후 main에 머지)
       ├─ feature/<scope>-<작업명>
       ├─ fix/<scope>-<버그명>
       └─ hotfix/<이슈명>   ← main에서 분기
```

### 커밋 컨벤션

AngularJS Commit Convention을 따릅니다.  
`type(scope):` 이후 설명은 **반드시 한글**로 작성합니다.

```
feat(dashboard): 출퇴근 상태 카드 추가
fix(auth): 로그인 리다이렉트 버그 수정
test(attendance): 팀원 출근 현황 필터 테스트 작성
chore(app): Vercel Speed Insights 적용
```

| type | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `test` | 테스트 추가·수정 |
| `refactor` | 리팩토링 |
| `chore` | 빌드·설정 변경 |
| `docs` | 문서 수정 |
