# API 개요

> 백엔드 API 엔드포인트 목록입니다.
> 백엔드 준비 전까지 MSW mock으로 대체합니다. (#30 이슈)

Base URL: `VITE_API_BASE_URL` 환경변수로 설정

---

## 인증

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| POST | `/auth/login` | 로그인 | ✗ |
| POST | `/auth/logout` | 로그아웃 | ✓ |
| GET | `/auth/me` | 내 정보 조회 | ✓ |
| PUT | `/auth/me` | 내 정보 수정 | ✓ |
| PUT | `/auth/me/password` | 비밀번호 변경 | ✓ |

### POST `/auth/login`
```json
// Request
{ "email": "string", "password": "string" }

// Response 200
{ "accessToken": "string" }

// Response 401
{ "message": "이메일 또는 비밀번호가 올바르지 않습니다" }
```

### GET `/auth/me`
```json
// Response 200
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "USER" | "ADMIN",
  "avatarUrl": "string | null"
}
```

---

## 출퇴근

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/attendance` | 출퇴근 기록 조회 | ✓ |
| POST | `/attendance/clock-in` | 출근 | ✓ |
| POST | `/attendance/clock-out` | 퇴근 | ✓ |
| GET | `/attendance/settings` | 개인 근무 설정 조회 | ✓ |
| PUT | `/attendance/settings` | 개인 근무 설정 수정 | ✓ |

쿼리 파라미터:
- `GET /attendance?from=2024-02-01&to=2024-02-28` — 날짜 범위 필터

---

## 채팅

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/channels` | 채널 목록 | ✓ |
| POST | `/channels` | 채널 생성 | ✓ |
| GET | `/channels/:id/messages` | 메시지 목록 | ✓ |
| POST | `/channels/:id/messages` | 메시지 전송 | ✓ |

> 실시간 통신 방식(WebSocket vs Polling)은 미결정 (#37 이슈 참고)

---

## 캘린더

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/events` | 이벤트 목록 | ✓ |
| POST | `/events` | 이벤트 생성 | ✓ |
| PUT | `/events/:id` | 이벤트 수정 | ✓ |
| DELETE | `/events/:id` | 이벤트 삭제 | ✓ |

---

## 멤버

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/members` | 멤버 목록 | ✓ |
| PUT | `/members/:id/role` | 역할 변경 (관리자) | ✓ ADMIN |
| PATCH | `/members/:id/team` | 팀 변경 (관리자, 팀장) | ✓ ADMIN / TEAM_LEAD |
| DELETE | `/members/:id` | 멤버 비활성화 (관리자) | ✓ ADMIN |

---

## 파일 드라이브

| Method | Path | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/drive/files` | 파일/폴더 목록 | ✓ |
| POST | `/drive/folders` | 폴더 생성 | ✓ |
| POST | `/drive/upload` | 파일 업로드 | ✓ |
| GET | `/drive/files/:id/download` | 파일 다운로드 | ✓ |
| DELETE | `/drive/files/:id` | 파일/폴더 삭제 | ✓ |

---

## 에러 응답 형식

모든 API 에러는 아래 형식으로 반환됩니다.

```json
{
  "message": "에러 설명"
}
```

| 상태 코드 | 의미 |
|-----------|------|
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 필요 또는 만료 → 자동 로그아웃 처리 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 에러 |
