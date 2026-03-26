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

### 머지 역할 분담

- 기능 개발은 반드시 작업 브랜치에서 진행합니다.
- 작업 브랜치에서 바로 `main`으로 PR을 올리지 않습니다.
- 기본 흐름은 `작업 브랜치 → develop PR → develop 머지 → develop → main PR` 입니다.
- `develop` 머지는 작업 정리 후 진행할 수 있습니다.
- `main` 머지는 배포 성격이므로 저장소 관리자만 진행합니다.
- 즉, `main` 대상 PR은 `develop` 브랜치에서만 올립니다.
- `main` 머지 후에는 GitHub Release가 자동 생성되므로, 배포 PR 제목은 반드시 `release: v0.1.10` 같은 버전 형식을 사용합니다.

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

### 커밋 크기 원칙

- 기능 단위보다 큰 커밋은 금지합니다.
- 아주 작은 기능 하나가 끝날 때마다 바로 커밋합니다.
- 여러 기능, 여러 페이지, 여러 성격의 수정을 한 커밋에 함께 담지 않습니다.
- 커밋이 크다고 느껴지면 더 잘게 분리한 뒤 커밋합니다.
- 기본 기준은 `테스트 → 구현 → 리팩토링`을 가능한 한 가장 작은 단위로 나누는 것입니다.
- 커밋 메시지와 본문에는 비밀번호, 토큰, 개인 이메일, 내부 서버 정보 같은 민감한 내용을 절대 남기지 않습니다.
- 실제 계정이나 테스트 계정 정보는 커밋 메시지, PR 본문, 이슈 본문에서 반드시 마스킹합니다.

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

### PR 생성 순서

1. `develop`에서 작업 브랜치를 분기합니다.
2. 기능 구현과 테스트를 작업 브랜치에서 마칩니다.
3. 작업 브랜치에서 `develop` 대상으로 PR을 생성합니다.
4. `develop` 머지 후 필요할 때 `develop`에서 `main` 대상으로 배포 PR을 생성합니다.
5. `main` 대상 배포 PR 제목은 `release: v0.1.10` 형식으로 작성합니다.
6. `main` 머지 후 GitHub Actions가 같은 버전 태그와 GitHub Release를 자동 생성합니다.

### 금지 사항

- 작업 브랜치에서 곧바로 `main` 대상으로 PR 생성 금지
- `main` 직접 push 금지
- `develop`을 거치지 않은 배포 PR 생성 금지

### PR 제목 형식

```
feat(auth): 로그인 페이지 구현
```

커밋 컨벤션과 동일한 형식 사용.

단, `develop -> main` 배포 PR은 아래 형식을 사용합니다.

```
release: v0.1.10
```

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
