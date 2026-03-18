import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { updateMemberRole, inviteMember } from '../membersApi'

const handlers = [
  http.patch('/members/:id/role', async ({ params, request }) => {
    const body = await request.json() as { role: string }
    return HttpResponse.json({
      id: params.id,
      role: body.role,
    })
  }),
  http.post('/members/invite', async ({ request }) => {
    const body = await request.json() as { email: string; role: string }
    return HttpResponse.json({ id: `new-${Date.now()}`, email: body.email, role: body.role }, { status: 201 })
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('membersApi — 권한 관리', () => {
  it('updateMemberRole() 멤버 역할을 변경한다', async () => {
    const result = await updateMemberRole('1', 'team_lead')
    expect(result.id).toBe('1')
    expect(result.role).toBe('team_lead')
  })

  it('inviteMember() 멤버를 초대하고 201을 반환한다', async () => {
    const result = await inviteMember('newuser@yanus.kr', 'member')
    expect(result).toHaveProperty('id')
    expect(result.email).toBe('newuser@yanus.kr')
  })
})
