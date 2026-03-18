import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, register, getMe } from '../authClient'

describe('authClient.login', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('성공 시 accessToken을 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'fake-token' }),
      }),
    )
    const token = await login('user@test.com', 'password123')
    expect(token).toBe('fake-token')
  })

  it('올바른 URL과 body로 fetch를 호출한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'fake-token' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await login('user@test.com', 'password123')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@test.com', password: 'password123' }),
      }),
    )
  })

  it('401 응답 시 에러를 throw한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: '이메일 또는 비밀번호가 올바르지 않습니다' }),
      }),
    )
    await expect(login('user@test.com', 'wrong')).rejects.toThrow()
  })

  it('네트워크 에러 시 에러를 throw한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await expect(login('user@test.com', 'password123')).rejects.toThrow()
  })
})

describe('authClient.getMe', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('성공 시 User 객체를 반환한다', async () => {
    localStorage.setItem('accessToken', 'fake-token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: '1',
          name: '홍길동',
          team: 'dev',
          role: 'leader',
          online: true,
        }),
      }),
    )
    const user = await getMe()
    expect(user.name).toBe('홍길동')
    expect(user.role).toBe('leader')
  })

  it('401 응답 시 에러를 throw한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      }),
    )
    await expect(getMe()).rejects.toThrow()
  })
})

describe('authClient.register', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('성공 시 accessToken을 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ accessToken: 'registered-token' }),
      }),
    )
    const token = await register({
      name: '홍길동',
      email: 'new@test.com',
      password: 'password123',
      team: 'dev',
    })
    expect(token).toBe('registered-token')
  })

  it('올바른 URL과 body로 fetch를 호출한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ accessToken: 'registered-token' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await register({
      name: '홍길동',
      email: 'new@test.com',
      password: 'password123',
      team: 'dev',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '홍길동',
          email: 'new@test.com',
          password: 'password123',
          team: 'dev',
        }),
      }),
    )
  })
})
