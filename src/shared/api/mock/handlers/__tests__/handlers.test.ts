import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../index'
import { resetAuthMockData } from '../auth'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  resetAuthMockData()
})
afterAll(() => server.close())

describe('MSW 핸들러 — 인증', () => {
  it('POST /auth/login 성공 시 accessToken을 반환한다', async () => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@yanus.kr', password: 'password' }),
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.accessToken).toBeTruthy()
  })

  it('POST /auth/login 잘못된 자격증명 시 401을 반환한다', async () => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@test.com', password: 'wrong' }),
    })
    expect(res.status).toBe(401)
  })

  it('GET /auth/me 성공 시 User 객체를 반환한다', async () => {
    const res = await fetch('/auth/me', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('role')
  })

  it('POST /auth/register 성공 시 accessToken을 반환한다', async () => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '새사용자',
        email: 'new@yanus.kr',
        password: 'password123',
        team: 'dev',
      }),
    })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.accessToken).toBeTruthy()
  })

  it('POST /auth/register 중복 이메일이면 409를 반환한다', async () => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '중복사용자',
        email: 'admin@yanus.kr',
        password: 'password123',
        team: 'dev',
      }),
    })
    expect(res.status).toBe(409)
  })
})

describe('MSW 핸들러 — 출퇴근', () => {
  it('GET /api/v1/attendances 성공 시 배열을 반환한다', async () => {
    const res = await fetch('/api/v1/attendances?date=2026-03-22', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const data = await res.json() as { data: unknown[] }
    expect(res.status).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('POST /api/v1/attendances/check-in 성공 시 200을 반환한다', async () => {
    const res = await fetch('/api/v1/attendances/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-token' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/attendances/check-out 성공 시 200을 반환한다', async () => {
    const res = await fetch('/api/v1/attendances/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-token' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(200)
  })
})

describe('MSW 핸들러 — 채팅', () => {
  it('GET /channels 성공 시 채널 배열을 반환한다', async () => {
    const res = await fetch('/channels', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('GET /channels/:id/messages 성공 시 메시지 배열을 반환한다', async () => {
    const res = await fetch('/channels/1/messages', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })

  it('POST /channels/:id/messages 성공 시 201을 반환한다', async () => {
    const res = await fetch('/channels/1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-token' },
      body: JSON.stringify({ content: '테스트 메시지', type: 'text' }),
    })
    expect(res.status).toBe(201)
  })
})

describe('MSW 핸들러 — 캘린더', () => {
  it('GET /events 성공 시 이벤트 배열을 반환한다', async () => {
    const res = await fetch('/events', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })

  it('POST /events 성공 시 201을 반환한다', async () => {
    const res = await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-token' },
      body: JSON.stringify({ title: '테스트 이벤트', startDate: '2026-04-01', startTime: '10:00', endDate: '2026-04-01', endTime: '11:00' }),
    })
    expect(res.status).toBe(201)
  })
})

describe('MSW 핸들러 — 드라이브', () => {
  it('GET /drive/files 성공 시 파일 배열을 반환한다', async () => {
    const res = await fetch('/drive/files', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })

  it('DELETE /drive/files/:id 성공 시 200을 반환한다', async () => {
    const res = await fetch('/drive/files/1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mock-token' },
    })
    expect(res.status).toBe(200)
  })
})
