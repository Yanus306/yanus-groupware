import { http, HttpResponse } from 'msw'

let mockMembers = [
  { id: '1', name: '김리더', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN', online: true },
  { id: '2', name: '박팀장', email: 'lead@yanus.kr', team: 'FRONTEND', role: 'TEAM_LEAD', online: true },
  { id: '3', name: '이멤버', email: 'user@yanus.kr', team: 'AI', role: 'MEMBER', online: false },
  { id: '4', name: '최개발', email: 'dev@yanus.kr', team: 'BACKEND', role: 'MEMBER', online: true },
  { id: '5', name: '정보안', email: 'sec@yanus.kr', team: 'SECURITY', role: 'MEMBER', online: false },
]

export const membersHandlers = [
  http.get('/members', () => {
    return HttpResponse.json(mockMembers)
  }),

  http.patch('/members/:id/role', async ({ params, request }) => {
    const body = await request.json() as { role: string }
    mockMembers = mockMembers.map((m) =>
      m.id === params.id ? { ...m, role: body.role } : m
    )
    const updated = mockMembers.find((m) => m.id === params.id)
    return HttpResponse.json({ id: params.id, role: body.role, ...updated })
  }),

  http.post('/members/invite', async ({ request }) => {
    const body = await request.json() as { email: string; role: string }
    const newMember = {
      id: `m${Date.now()}`,
      email: body.email,
      role: body.role,
      name: body.email.split('@')[0],
      team: 'BACKEND',
      online: false,
    }
    mockMembers = [...mockMembers, newMember]
    return HttpResponse.json(newMember, { status: 201 })
  }),
]
