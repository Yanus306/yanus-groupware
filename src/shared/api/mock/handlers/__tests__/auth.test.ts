import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { authHandlers, resetAuthMockData } from '../auth'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetAuthMockData())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MSW 인증 핸들러', () => {
  it('형식이 올바르지 않은 refresh token은 사용자 토큰으로 해석하지 않는다', async () => {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: '1' }),
    })

    expect(response.status).toBe(401)
  })
})
