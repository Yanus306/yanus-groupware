# CI/CD 트러블슈팅

---

## Vercel CD — `No existing credentials found`

**발생 시점**: PR #24 develop → main 머지 후 CD 잡 실패

### 증상

```
Error: No existing credentials found. Please run 'vercel login' or pass "--token"
```

### 원인

GitHub Repository Secrets에 `VERCEL_TOKEN`이 설정되지 않은 상태에서 CD 잡이 실행됨.

### 해결 방법 1: Vercel 시크릿 등록

GitHub 레포 → Settings → Secrets and variables → Actions 에서 아래 3개 등록:

```
VERCEL_TOKEN       ← Vercel 계정 토큰
VERCEL_ORG_ID      ← Vercel 팀/개인 ID
VERCEL_PROJECT_ID  ← Vercel 프로젝트 ID
```

Vercel 토큰 발급: [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)

`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 확인:

```bash
vercel link  # 프로젝트 연결
cat .vercel/project.json  # projectId, orgId 확인
```

### 해결 방법 2: 시크릿 없을 때 잡 건너뛰기 (현재 적용)

```yaml
jobs:
  deploy:
    if: ${{ secrets.VERCEL_TOKEN != '' }}
```

시크릿이 없으면 CD 잡 전체를 건너뜀. CI는 정상 동작, CD만 스킵.

### 관련 파일
`.github/workflows/cd.yml`

---

## GitHub Actions — `npm ci` 캐시 오류

### 증상

```
Error: Dependencies lock file is not found in /home/runner/work/...
```

### 원인

`package-lock.json`이 `.gitignore`에 포함되거나 커밋되지 않은 경우.

### 해결

`package-lock.json`은 반드시 커밋에 포함되어야 합니다.

```bash
git add package-lock.json
git commit -m "chore: package-lock.json 추가"
```

---

## GitHub PR — 자신의 PR을 직접 Approve할 수 없음

### 증상

```
Error: Review: Can not approve your own pull request
```

### 원인

GitHub 정책상 PR 작성자는 자신의 PR을 Approve할 수 없음.

### 해결

Approve 대신 LGTM 코멘트로 대체하고 머지 진행.

```bash
# Approve 대신 코멘트
gh pr comment 24 --body "LGTM"

# 머지
gh pr merge 24 --squash --delete-branch
```

---

## Vercel 빌드 — TypeScript 오류로 빌드 실패

### 증상

Vercel 대시보드에서 빌드 실패, CI는 통과했는데 Vercel만 실패.

### 원인

로컬 Node.js 버전과 Vercel 빌드 환경의 TypeScript 버전 차이로 인해
CI에선 통과했지만 Vercel 환경에서 다른 오류 발생 가능.

### 해결

`vercel.json` 또는 Vercel 프로젝트 설정에서 Node 버전 고정:

```json
// vercel.json
{
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  }
}
```

또는 GitHub Actions CI에서 사용하는 Node 버전과 동일하게 맞춤.
