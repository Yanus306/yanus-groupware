import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../index'

// auth, attendance, members는 실제 백엔드 사용 — mock 핸들러 테스트 제외
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

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
