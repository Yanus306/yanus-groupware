import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { login, register, getMe } from '../authClient'

const server = setupServer(
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'admin@yanus.kr' && body.password === 'password') {
      return HttpResponse.json({
        code: 'SUCCESS',
        message: 'ok',
        data: { accessToken: 'mock-token', refreshToken: 'refresh-token', tokenType: 'Bearer' },
      })
    }
    return HttpResponse.json(
      { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다', data: null },
      { status: 401 },
    )
  }),
  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string }
    if (body.email === 'dup@yanus.kr') {
      return HttpResponse.json(
        { code: 'CONFLICT', message: '이미 가입된 이메일입니다', data: null },
        { status: 409 },
      )
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'created', data: null }, { status: 201 })
  }),
  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: '1', name: '김리더', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN' },
    }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('authClient', () => {
  describe('login()', () => {
    it('성공 시 accessToken을 반환한다', async () => {
      const token = await login('admin@yanus.kr', 'password')
      expect(token).toBe('mock-token')
    })

    it('잘못된 자격증명이면 에러를 던진다', async () => {
      await expect(login('wrong@test.com', 'wrong')).rejects.toThrow()
    })
  })

  describe('register()', () => {
    it('성공 시 완료된다', async () => {
      await expect(
        register({ name: '신규', email: 'new@yanus.kr', password: 'pass123', teamId: 1 }),
      ).resolves.not.toThrow()
    })

    it('중복 이메일이면 에러를 던진다', async () => {
      await expect(
        register({ name: '중복', email: 'dup@yanus.kr', password: 'pass123', teamId: 1 }),
      ).rejects.toThrow('이미 가입된 이메일입니다')
    })
  })

  describe('getMe()', () => {
    it('현재 사용자 정보를 반환한다', async () => {
      const user = await getMe()
      expect(user).toMatchObject({
        id: '1',
        name: '김리더',
        email: 'admin@yanus.kr',
        role: 'ADMIN',
        team: 'BACKEND',
      })
    })
  })
})
