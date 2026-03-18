import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMembers } from '../membersApi'

const membersHandlers = [
  http.get('/members', () => {
    return HttpResponse.json([
      { id: '1', name: '김리더', team: 'dev', role: 'leader', online: true },
      { id: '2', name: '박팀장', team: 'design', role: 'team_lead', online: true },
      { id: '3', name: '이멤버', team: 'marketing', role: 'member', online: false },
    ])
  }),
]

const server = setupServer(...membersHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('membersApi', () => {
  it('getMembers() 멤버 목록을 반환한다', async () => {
    const members = await getMembers()
    expect(members).toHaveLength(3)
    expect(members[0]).toMatchObject({ id: '1', name: '김리더', role: 'leader' })
  })
})
