import { http, HttpResponse } from 'msw'

let mockMembers = [
  { id: '1', name: '김리더', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN', status: 'ACTIVE', online: true },
  { id: '2', name: '박팀장', email: 'lead@yanus.kr', team: 'FRONTEND', role: 'TEAM_LEAD', status: 'ACTIVE', online: true },
  { id: '3', name: '이멤버', email: 'user@yanus.kr', team: 'AI', role: 'MEMBER', status: 'ACTIVE', online: false },
  { id: '4', name: '최개발', email: 'dev@yanus.kr', team: 'BACKEND', role: 'MEMBER', status: 'ACTIVE', online: true },
  { id: '5', name: '정보안', email: 'sec@yanus.kr', team: 'SECURITY', role: 'MEMBER', status: 'INACTIVE', online: false },
]

const mockTeams = [
  { id: 1, name: 'BACKEND' },
  { id: 2, name: 'FRONTEND' },
  { id: 3, name: 'AI' },
  { id: 4, name: 'SECURITY' },
]

export const membersHandlers = [
  http.get('/api/v1/members', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockMembers }),
  ),

  http.get('/api/v1/members/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const userId = auth.replace('Bearer mock-token-', '') || '1'
    const member = mockMembers.find((m) => m.id === userId) ?? mockMembers[0]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: member })
  }),

  http.get('/api/v1/members/:id', ({ params }) => {
    const member = mockMembers.find((m) => m.id === params.id)
    if (!member) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '멤버를 찾을 수 없습니다', data: null }, { status: 404 })
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: member })
  }),

  http.patch('/api/v1/members/:id/role', async ({ params, request }) => {
    const body = await request.json() as { role: string }
    mockMembers = mockMembers.map((m) =>
      m.id === params.id ? { ...m, role: body.role } : m,
    )
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),

  http.delete('/api/v1/members/:id', ({ params }) => {
    mockMembers = mockMembers.map((m) =>
      m.id === params.id ? { ...m, status: 'INACTIVE' } : m,
    )
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),

  http.patch('/api/v1/members/:id/activate', ({ params }) => {
    mockMembers = mockMembers.map((m) =>
      m.id === params.id ? { ...m, status: 'ACTIVE' } : m,
    )
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),

  http.put('/api/v1/members/me', async ({ request }) => {
    const body = await request.json() as { name?: string; password?: string }
    const auth = request.headers.get('Authorization') ?? ''
    const userId = auth.replace('Bearer mock-token-', '') || '1'
    if (body.name) {
      mockMembers = mockMembers.map((m) =>
        m.id === userId ? { ...m, name: body.name! } : m,
      )
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),

  http.get('/api/v1/teams', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: mockTeams }),
  ),

  http.get('/api/v1/teams/:id', ({ params }) => {
    const team = mockTeams.find((t) => t.id === Number(params.id))
    if (!team) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '팀을 찾을 수 없습니다', data: null }, { status: 404 })
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: team })
  }),
]
