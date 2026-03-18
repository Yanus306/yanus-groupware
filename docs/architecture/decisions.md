# 아키텍처 결정 기록 (ADR)

주요 기술 결정과 그 이유를 기록합니다.

---

## ADR-001: FSD 아키텍처 채택

**날짜**: 2025-03
**상태**: 적용됨

### 배경
초기 구조가 `components/`, `context/`, `pages/` 로 나뉘어 있었으나,
기능이 늘어날수록 어디에 코드를 넣어야 할지 불명확해짐.

### 결정
Feature-Sliced Design(FSD)을 채택.
`app → pages → widgets → features → entities → shared` 레이어 계층 구조를 따름.

### 이유
- 기능 중심 구조로 팀원이 특정 기능 코드를 바로 찾을 수 있음
- 레이어 의존 규칙으로 순환 참조 원천 차단
- 기능 추가·삭제가 다른 기능에 영향을 최소화

### 트레이드오프
- 초기 설정 비용이 높음 (기존 코드 마이그레이션 필요)
- 소규모 프로젝트엔 과할 수 있으나 장기적 유지보수성을 선택

---

## ADR-002: 상태 관리로 React Context API 선택

**날짜**: 2025-03
**상태**: 적용됨

### 배경
CLAUDE.md에는 Zustand를 명시했으나, 현재 앱 규모와 요구사항 분석 결과 재검토.

### 결정
React Context API를 사용. Zustand는 도입하지 않음.

### 이유
- 현재 상태가 Provider 단위로 명확히 분리됨 (auth, chat, calendar, tasks)
- 외부 라이브러리 의존성 최소화
- Context API로 충분한 수준의 상태 관리 가능

### 트레이드오프
- 상태가 복잡해지면 Context 중첩이 깊어질 수 있음
- 퍼포먼스 최적화(selector 등)가 Zustand에 비해 제한적

### 재검토 조건
전역 상태가 10개 이상으로 늘어나거나 잦은 리렌더링 이슈 발생 시 Zustand 마이그레이션 검토.

---

## ADR-003: CSS 파일 방식 선택 (Tailwind 미채택)

**날짜**: 2025-03
**상태**: 적용됨

### 배경
CLAUDE.md에는 Tailwind CSS를 명시했으나, 초기 퍼블리싱이 CSS 파일로 구현된 상태였음.

### 결정
레이어별 CSS 파일 방식 유지. Tailwind는 도입하지 않음.

### 이유
- 기존 코드 전체를 Tailwind로 재작성하는 비용이 큼
- 현재 다크 테마 CSS 변수 기반 구조가 잘 동작함
- 일관성 유지를 위해 동일 방식 계속 사용

### 재검토 조건
신규 페이지/컴포넌트 작성 시 팀 합의 후 Tailwind 혼용 또는 전환 결정.

---

## ADR-004: TDD 방식으로 개발

**날짜**: 2025-03
**상태**: 적용됨

### 결정
모든 기능 코드는 테스트를 먼저 작성한 후 구현한다 (RED → GREEN → REFACTOR).

### 이유
- 구현 전 인터페이스를 명확히 정의하게 됨
- 리팩토링 시 회귀 방지
- 테스트 자체가 기능 명세 역할

### 커밋 규칙
테스트 커밋(`test(scope): ...`)과 구현 커밋(`feat(scope): ...`)을 반드시 분리.

---

## ADR-005: Vercel 배포 + GitHub Actions CI/CD

**날짜**: 2025-03
**상태**: 적용됨

### 결정
- CI: GitHub Actions (test → build 자동 검증)
- CD: Vercel (develop → Preview, main → Production)

### Vercel 조건부 실행
`VERCEL_TOKEN` secret이 설정되지 않으면 CD 잡을 건너뜀.
팀원이 secret 없이 fork해도 CD 실패가 나지 않음.

```yaml
if: ${{ secrets.VERCEL_TOKEN != '' }}
```
