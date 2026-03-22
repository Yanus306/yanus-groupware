import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMembers, updateMemberRole, getMyProfile, updateMyProfile } from '../membersApi'

const server = setupServer(
  http.get('/api/v1/members', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: '1', name: '김리더', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN' },
        { id: '2', name: '박팀장', email: 'lead@yanus.kr', team: 'FRONTEND', role: 'TEAM_LEAD' },
      ],
    }),
  ),
  http.patch('/api/v1/members/:id/role', async () => {
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: null,
    })
  }),
  http.get('/api/v1/members/me', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: '1', name: '김리더', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN' },
    }),
  ),
  http.put('/api/v1/members/me', async () => {
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('membersApi', () => {
  it('getMembers() 멤버 목록을 반환한다', async () => {
    const members = await getMembers()
    expect(members).toHaveLength(2)
    expect(members[0]).toMatchObject({ name: '김리더', role: 'ADMIN', team: 'BACKEND' })
  })

  it('updateMemberRole() 역할을 변경한다', async () => {
    await expect(updateMemberRole('1', 'TEAM_LEAD')).resolves.not.toThrow()
  })

  it('getMyProfile() 내 프로필을 반환한다', async () => {
    const profile = await getMyProfile()
    expect(profile).toMatchObject({ name: '김리더', email: 'admin@yanus.kr' })
  })

  it('updateMyProfile() 내 프로필을 업데이트한다', async () => {
    await expect(updateMyProfile({ name: '새이름' })).resolves.not.toThrow()
  })
})
