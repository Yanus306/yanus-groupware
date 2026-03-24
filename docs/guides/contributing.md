# 기여 가이드

> 최신 Git / GitHub 네이밍 및 리뷰 규칙은 [git-conventions.md](./git-conventions.md)를 우선합니다.  
> 이 문서는 개발 흐름과 일반 가이드 중심으로 참고합니다.

## 브랜치 전략

```
main          ← 프로덕션 (Vercel 자동 배포)
  └─ develop  ← 통합 개발 (PR 검증 후 main 머지)
       ├─ feature/<scope>-<작업명>
       ├─ fix/<scope>-<버그명>
       └─ hotfix/<이슈명>  ← main에서 분기
```

### 브랜치 생성 규칙

```bash
# 기능 개발
git checkout -b feature/auth-login-page develop

# 버그 수정
git checkout -b fix/auth-token-refresh develop

# 긴급 수정
git checkout -b hotfix/login-redirect-loop main
```

브랜치명 규칙:
- 영문 소문자 + 하이픈
- `feature/auth-login-page` (O)
- `feature/로그인페이지` (X — 한글 금지)

---

## 커밋 컨벤션

AngularJS Commit Convention을 따릅니다.

```
<type>(<scope>): <한글 설명>
```

### type 목록

| type | 설명 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat(auth): 로그인 페이지 구현` |
| `fix` | 버그 수정 | `fix(auth): 토큰 만료 처리 오류 수정` |
| `test` | 테스트 추가·수정 | `test(auth): 로그인 실패 케이스 테스트 추가` |
| `refactor` | 리팩토링 | `refactor(calendar): 이벤트 로직 features로 분리` |
| `chore` | 빌드·설정 변경 | `chore(ci): Node 버전 20으로 업그레이드` |
| `docs` | 문서 수정 | `docs(readme): 환경변수 설명 추가` |
| `style` | 코드 포맷 변경 | `style(dashboard): 들여쓰기 정리` |

### TDD 커밋 순서

테스트와 구현은 반드시 별도 커밋으로 분리합니다.

```
test(auth): 로그인 폼 유효성 검사 테스트 작성   ← RED
feat(auth): 로그인 폼 유효성 검사 구현          ← GREEN
refactor(auth): 로그인 폼 로직 분리             ← REFACTOR (필요시)
```

### 금지 사항

```
# ❌ 영문 설명 — 한글로 작성
feat(auth): implement login page

# ❌ type/scope 생략
로그인 페이지 추가

# ❌ 여러 기능을 하나로 묶음
feat(auth): add login, logout, signup pages

# ❌ Co-Authored-By 추가 금지
```

---

## PR 규칙

### PR 대상

| 브랜치 | 머지 대상 | 조건 |
|--------|-----------|------|
| `feature/*` | `develop` | CI 통과 필수 |
| `fix/*` | `develop` | CI 통과 필수 |
| `develop` | `main` | CI 통과 + 브라우저 렌더링 확인 |
| `hotfix/*` | `main` + `develop` | CI 통과 필수 |

### PR 제목 형식

```
feat(auth): 로그인 페이지 구현
```

커밋 컨벤션과 동일한 형식 사용.

### PR 머지 전 체크리스트

- [ ] `npm run test:run` 통과
- [ ] `npm run build` 통과
- [ ] 브라우저에서 실제 렌더링 확인
- [ ] 리뷰어 LGTM 코멘트

---

## 이슈 관리

- 작업 시작 전 GitHub Issue를 먼저 생성한다
- 이슈 번호를 브랜치명에 포함하지 않아도 되지만, PR body에 `closes #번호` 를 명시한다
- `develop` 대상 PR은 머지 후 이슈를 **수동으로 close**한다
  (GitHub은 default branch인 `main` 머지 시에만 자동 close)
- 이슈 close 시 완료 사유 코멘트 필수

---

## 개발 환경 세팅

```bash
git clone https://github.com/Yanus306/yanus-groupware.git
cd yanus-groupware
npm install

# .env 파일 생성
cp .env.example .env
# VITE_USE_MOCK=true 로 설정하면 MSW mock API 사용 가능

npm run dev
```
