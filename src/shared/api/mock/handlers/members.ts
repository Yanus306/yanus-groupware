import { http, HttpResponse } from 'msw'

let mockMembers = [
  { id: '1', name: '김리더', team: 'dev', role: 'leader', online: true },
  { id: '2', name: '박팀장', team: 'design', role: 'team_lead', online: true },
  { id: '3', name: '이멤버', team: 'marketing', role: 'member', online: false },
  { id: '4', name: '최개발', team: 'dev', role: 'member', online: true },
  { id: '5', name: '정디자인', team: 'design', role: 'member', online: false },
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
      team: 'dev',
      online: false,
    }
    mockMembers = [...mockMembers, newMember]
    return HttpResponse.json(newMember, { status: 201 })
  }),
]
