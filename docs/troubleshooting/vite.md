# Vite / 개발 서버 트러블슈팅

---

## Windows — `spawn npm ENOENT` (Claude Preview 서버 실행 실패)

**발생 시점**: `.claude/launch.json` 으로 preview 서버 실행 시

### 증상

```
Failed to start server: spawn npm ENOENT
```

### 원인

Windows에서 `npm`은 실제로 `npm.cmd` 배치 파일로 동작합니다.
`spawn`으로 직접 `npm`을 실행하면 `.cmd` 확장자가 없어 찾을 수 없습니다.

### 해결 시도 1: `npm.cmd` 사용 → `spawn EINVAL` 발생

```json
{ "runtimeExecutable": "npm.cmd" }
```

Windows 환경에 따라 `EINVAL` 오류가 발생할 수 있음.

### 최종 해결: `node`로 vite 직접 실행

```json
{
  "runtimeExecutable": "node",
  "runtimeArgs": ["C:/절대경로/node_modules/vite/bin/vite.js", "preview"]
}
```

`node_modules/vite/bin/vite.js`를 Node.js로 직접 실행하면 OS 차이 없이 동작합니다.

> **주의**: worktree 환경에서는 `node_modules`가 부모 레포지토리에 있으므로
> 워크트리 내부의 상대 경로가 아닌 **부모 레포의 절대 경로**를 사용해야 합니다.

### 관련 파일
`.claude/launch.json`

---

## Vite PWA — `sw.js` 생성 오류

### 증상

```
Error: injectManifest requires srcDir/filename to exist
```

### 원인

`vite.config.ts`에서 `strategies: 'injectManifest'`로 설정 시
`public/sw.js` 파일이 없으면 빌드 실패.

### 해결

`public/sw.js` 파일 생성:

```js
// public/sw.js
self.addEventListener('install', () => {})
self.addEventListener('fetch', () => {})
```

---

## Vite — `Cannot use import statement in a module` (jest-dom)

### 증상

```
SyntaxError: Cannot use import statement in a module
```

### 원인

`src/test/setup.ts`에서 `@testing-library/jest-dom`을 import할 때
CommonJS/ESM 충돌 발생.

### 해결

`vite.config.ts`에서 명시적으로 설정:

```ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

`package.json`에 type이 `"module"`로 설정되어 있는지 확인.

---

## Vite — 개발 서버 포트 충돌

### 증상

```
Error: listen EADDRINUSE: address already in use :::5173
```

### 해결

다른 포트로 실행하거나 기존 프로세스 종료:

```bash
# 다른 포트로 실행
npm run dev -- --port 3000

# Windows에서 포트 사용 프로세스 확인
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

또는 `vite.config.ts`에서 포트 고정:

```ts
export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,  // 포트 충돌 시 다른 포트 자동 사용
  },
})
```
