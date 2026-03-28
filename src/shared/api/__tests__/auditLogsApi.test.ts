import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getAuditLogs } from '../auditLogsApi'

const server = setupServer(
  http.get('/api/v1/audit-logs', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        {
          id: 1,
          actorId: 99,
          actorRole: 'ADMIN',
          targetId: 2,
          action: 'TEAM_CHANGE',
          previousValue: '1팀',
          newValue: '2팀',
          createdAt: '2026-03-29T10:00:00',
        },
      ],
    }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('auditLogsApi', () => {
  it('getAuditLogs() 감사 로그 목록을 반환한다', async () => {
    const logs = await getAuditLogs()

    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      actorRole: 'ADMIN',
      action: 'TEAM_CHANGE',
      previousValue: '1팀',
      newValue: '2팀',
    })
  })
})
