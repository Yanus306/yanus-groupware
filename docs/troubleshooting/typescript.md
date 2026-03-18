# TypeScript 트러블슈팅

---

## TS5119: `erasableSyntaxOnly` — 파라미터 프로퍼티 사용 불가

**발생 시점**: PR #15 CI 빌드 실패

### 증상

```
error TS5119: Option 'erasableSyntaxOnly' can only be used when 'isolatedModules' is set to true.
error TS2671: Parameter properties are not allowed when using 'erasableSyntaxOnly'.
```

### 원인

TypeScript 5.9+ 에서 `tsconfig.json`에 `erasableSyntaxOnly: true` 옵션이 설정된 경우,
클래스 생성자의 **파라미터 프로퍼티(Parameter Property)** 문법이 허용되지 않음.

```ts
// ❌ 허용되지 않음 — constructor 파라미터에 접근 제어자 사용
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
```

### 해결

파라미터 프로퍼티를 명시적 필드 선언으로 교체.

```ts
// ✅ 올바른 방식 — 필드를 명시적으로 선언하고 생성자 본문에서 할당
class ApiError extends Error {
  status: number  // ← 필드 먼저 선언

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status  // ← 생성자 본문에서 할당
  }
}
```

### 관련 파일
`src/shared/api/baseClient.ts`

---

## 타입 단언 `as` 사용 시 주의

### 증상

환경 변수 접근 시 타입 오류.

```ts
// ❌ 타입 오류 가능성
const url = import.meta.env.VITE_AI_API_URL

// ✅ 명시적 타입 단언
const url = import.meta.env.VITE_AI_API_URL as string | undefined
```

`undefined`를 포함해야 실제로 없을 때의 케이스를 안전하게 처리 가능.

---

## `any` 타입 사용 금지

이 프로젝트는 `any` 타입 사용을 금지합니다.

```ts
// ❌ 금지
function handleData(data: any) { ... }

// ✅ 구체적 타입 또는 unknown 사용
function handleData(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

ESLint `@typescript-eslint/no-explicit-any` 규칙으로 자동 검사됩니다.
