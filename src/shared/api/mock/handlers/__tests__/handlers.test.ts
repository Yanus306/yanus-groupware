import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../index'
import { resetDriveMockData } from '../drive'
import { getTodayStr } from '../../../../lib/date'

// auth, members, attendance, calendar — 실제 백엔드 사용 (mock 핸들러 테스트 제외)
// chat, drive mock 핸들러만 테스트
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  resetDriveMockData()
})
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

describe('MSW 핸들러 — 드라이브', () => {
  it('GET /api/v1/drive 성공 시 파일 배열을 반환한다', async () => {
    const res = await fetch('/api/v1/drive', {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const body = await res.json() as { code: string; data: unknown[] }
    expect(res.status).toBe(200)
    expect(body.code).toBe('SUCCESS')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('DELETE /api/v1/drive/:id 성공 시 200을 반환한다', async () => {
    const res = await fetch('/api/v1/drive/1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mock-token' },
    })
    expect(res.status).toBe(200)
  })

  it('POST /api/v1/drive/upload 성공 시 로그인한 멤버 업로더를 반환한다', async () => {
    const formData = new FormData()
    formData.append('file', new File(['hello'], 'shared-guide.txt', { type: 'text/plain' }))

    const res = await fetch('/api/v1/drive/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-token-3' },
      body: formData,
    })

    const body = await res.json() as {
      code: string
      data: { uploadedById: number; uploadedByName: string }
    }

    expect(res.status).toBe(201)
    expect(body.code).toBe('SUCCESS')
    expect(body.data.uploadedById).toBe(3)
    expect(body.data.uploadedByName).toBe('이멤버')
  })
})

describe('MSW 핸들러 — 출퇴근 예외 처리', () => {
  it('야간 미퇴근 일괄 자동 퇴근은 scheduledEndAt 기준으로 다음날 퇴근 시간을 반영한다', async () => {
    const today = getTodayStr()
    const beforeRes = await fetch(`/api/v1/attendance-exceptions?date=${today}&type=MISSED_CHECK_OUT`, {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const beforeBody = await beforeRes.json() as {
      data: { items: Array<{ id: number; scheduledEndAt: string | null; checkOutTime: string | null }> }
    }
    const overnightException = beforeBody.data.items.find((item) => item.scheduledEndAt?.includes('T06:00:00'))

    expect(overnightException).toBeDefined()
    expect(overnightException?.checkOutTime).toBeNull()

    const bulkRes = await fetch('/api/v1/attendance-exceptions/bulk-auto-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-token' },
      body: JSON.stringify({ date: today, memberIds: [2] }),
    })
    const bulkBody = await bulkRes.json() as { data: { processedCount: number; updatedIds: number[] } }

    expect(bulkRes.status).toBe(200)
    expect(bulkBody.data).toEqual({ processedCount: 1, updatedIds: [overnightException?.id] })

    const afterRes = await fetch(`/api/v1/attendance-exceptions?date=${today}&status=RESOLVED`, {
      headers: { Authorization: 'Bearer mock-token' },
    })
    const afterBody = await afterRes.json() as {
      data: { items: Array<{ id: number; scheduledEndAt: string | null; checkOutTime: string | null }> }
    }
    const resolved = afterBody.data.items.find((item) => item.id === overnightException?.id)

    expect(resolved?.checkOutTime).toBe(overnightException?.scheduledEndAt)
  })
})
