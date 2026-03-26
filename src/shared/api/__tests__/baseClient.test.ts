import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { baseClient } from '../baseClient'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
  sessionStorage.clear()
})
afterAll(() => server.close())

describe('baseClient', () => {
  it('{ code, message, data } 래퍼에서 data를 자동으로 추출한다', async () => {
    server.use(
      http.get('/test-wrap', () =>
        HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { id: 1, name: '테스트' } }),
      ),
    )
    const result = await baseClient.get<{ id: number; name: string }>('/test-wrap')
    expect(result).toEqual({ id: 1, name: '테스트' })
  })

  it('래퍼가 없는 일반 JSON 응답도 그대로 반환한다', async () => {
    server.use(
      http.get('/test-plain', () => HttpResponse.json([1, 2, 3])),
    )
    const result = await baseClient.get<number[]>('/test-plain')
    expect(result).toEqual([1, 2, 3])
  })

  it('401 응답 시 ApiError를 던진다', async () => {
    server.use(
      http.get('/test-401', () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: '인증 실패', data: null }, { status: 401 }),
      ),
    )
    await expect(baseClient.get('/test-401')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      message: '인증 실패',
    })
  })

  it('access token 만료 시 refresh로 재발급한 뒤 요청을 다시 수행한다', async () => {
    localStorage.setItem('accessToken', 'expired-access-token')
    localStorage.setItem('refreshToken', 'refresh-token')

    server.use(
      http.get('/test-refresh', ({ request }) => {
        const authorization = request.headers.get('Authorization')
        if (authorization === 'Bearer renewed-access-token') {
          return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { ok: true } })
        }
        return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'access 만료', data: null }, { status: 401 })
      }),
      http.post('/api/v1/auth/refresh', async ({ request }) => {
        const body = await request.json() as { refreshToken: string }
        expect(body.refreshToken).toBe('refresh-token')
        return HttpResponse.json({
          code: 'SUCCESS',
          message: 'ok',
          data: {
            accessToken: 'renewed-access-token',
            refreshToken: 'renewed-refresh-token',
            tokenType: 'Bearer',
          },
        })
      }),
    )

    const result = await baseClient.get<{ ok: boolean }>('/test-refresh')
    expect(result).toEqual({ ok: true })
    expect(localStorage.getItem('accessToken')).toBe('renewed-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('renewed-refresh-token')
  })

  it('refresh token도 만료되면 토큰을 정리하고 ApiError를 던진다', async () => {
    localStorage.setItem('accessToken', 'expired-access-token')
    localStorage.setItem('refreshToken', 'expired-refresh-token')

    server.use(
      http.get('/test-refresh-expired', () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: 'access 만료', data: null }, { status: 401 }),
      ),
      http.post('/api/v1/auth/refresh', () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: 'refresh 만료', data: null }, { status: 401 }),
      ),
    )

    await expect(baseClient.get('/test-refresh-expired')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(sessionStorage.getItem('yanus-session-expired-message')).toBe('세션이 만료되어 다시 로그인해 주세요')
  })

  it('4xx 응답 시 ApiError를 던진다', async () => {
    server.use(
      http.get('/test-4xx', () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: '찾을 수 없습니다', data: null }, { status: 404 }),
      ),
    )
    await expect(baseClient.get('/test-4xx')).rejects.toThrow('찾을 수 없습니다')
  })

  it('post() 요청도 래퍼에서 data를 추출한다', async () => {
    server.use(
      http.post('/test-post', () =>
        HttpResponse.json({ code: 'SUCCESS', message: 'created', data: { id: 42 } }),
      ),
    )
    const result = await baseClient.post<{ id: number }>('/test-post', { name: '신규' })
    expect(result).toEqual({ id: 42 })
  })
})
