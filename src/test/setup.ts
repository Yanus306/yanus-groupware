import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'

// node 환경(msw/node 기반 API 테스트)에서 localStorage가 없을 경우 스텁 제공
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  })
}

beforeEach(() => {
  try { localStorage.clear() } catch {}
})

afterEach(() => {
  try { localStorage.clear() } catch {}
})
