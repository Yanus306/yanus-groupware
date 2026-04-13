import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { login, register, getMe, logout, verifyEmail, resendVerificationEmail } from '../authClient'

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
    if (body.email === 'inactive@yanus.kr' && body.password === 'password') {
      return HttpResponse.json(
        { code: 'MEMBER_INACTIVE', message: '비활성화된 계정입니다', data: null },
        { status: 403 },
      )
    }
    if (body.email === 'locked@yanus.kr' && body.password === 'password') {
      return HttpResponse.json(
        { code: 'ACCOUNT_LOCKED', message: '로그인 5회 실패로 계정이 잠겼습니다', data: null },
        { status: 403 },
      )
    }
    if (body.email === 'pending@yanus.kr' && body.password === 'password') {
      return HttpResponse.json(
        { code: 'MEMBER_PENDING', message: '이메일 인증이 완료되지 않은 계정입니다.', data: null },
        { status: 403 },
      )
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
  http.post('/api/v1/auth/logout', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
  http.post('/api/v1/auth/verify-email', async ({ request }) => {
    const body = await request.json() as { token: string }
    if (body.token === 'valid-token') {
      return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: {} })
    }

    return HttpResponse.json(
      { code: 'INVALID_TOKEN', message: '유효하지 않거나 만료된 인증 링크입니다', data: null },
      { status: 400 },
    )
  }),
  http.post('/api/v1/auth/verify-email/resend', async ({ request }) => {
    const body = await request.json() as { email: string }
    if (body.email === 'unknown@yanus.kr') {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '가입된 이메일을 찾을 수 없습니다', data: null },
        { status: 404 },
      )
    }

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: {} })
  }),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

describe('authClient', () => {
  describe('login()', () => {
    it('성공 시 accessToken을 반환한다', async () => {
      const token = await login('admin@yanus.kr', 'password')
      expect(token).toBe('mock-token')
      expect(localStorage.getItem('accessToken')).toBe('mock-token')
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
    })

    it('잘못된 자격증명이면 에러를 던진다', async () => {
      await expect(login('wrong@test.com', 'wrong')).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다')
    })

    it('비활성 계정이면 전용 안내 문구를 반환한다', async () => {
      await expect(login('inactive@yanus.kr', 'password')).rejects.toThrow(
        '비활성화된 계정입니다. 관리자에게 문의해 주세요',
      )
    })

    it('계정 잠금 상태면 전용 안내 문구를 반환한다', async () => {
      await expect(login('locked@yanus.kr', 'password')).rejects.toThrow(
        '로그인 5회 실패로 계정이 잠겼습니다. 30분 후 다시 시도해 주세요',
      )
    })

    it('이메일 인증 전 계정이면 전용 안내 문구를 반환한다', async () => {
      await expect(login('pending@yanus.kr', 'password')).rejects.toThrow(
        '이메일 인증을 완료한 뒤 로그인해 주세요',
      )
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

  describe('logout()', () => {
    it('로그아웃 요청이 성공한다', async () => {
      localStorage.setItem('accessToken', 'mock-token')
      localStorage.setItem('refreshToken', 'refresh-token')
      await expect(logout()).resolves.not.toThrow()
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })
  })

  describe('verifyEmail()', () => {
    it('유효한 토큰이면 완료된다', async () => {
      await expect(verifyEmail('valid-token')).resolves.not.toThrow()
    })

    it('유효하지 않은 토큰이면 에러를 던진다', async () => {
      await expect(verifyEmail('invalid-token')).rejects.toThrow('유효하지 않거나 만료된 인증 링크입니다')
    })
  })

  describe('resendVerificationEmail()', () => {
    it('재전송 요청이 성공한다', async () => {
      await expect(resendVerificationEmail('new@yanus.kr')).resolves.not.toThrow()
    })

    it('존재하지 않는 이메일이면 에러를 던진다', async () => {
      await expect(resendVerificationEmail('unknown@yanus.kr')).rejects.toThrow('가입된 이메일을 찾을 수 없습니다')
    })
  })
})
