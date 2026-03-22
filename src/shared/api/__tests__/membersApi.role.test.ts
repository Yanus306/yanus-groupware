import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { updateMemberRole } from '../membersApi'

const handlers = [
  http.patch('/api/v1/members/:id/role', async () => {
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('membersApi — 권한 관리', () => {
  it('updateMemberRole() 멤버 역할을 변경한다', async () => {
    await expect(updateMemberRole('1', 'TEAM_LEAD')).resolves.not.toThrow()
  })
})
