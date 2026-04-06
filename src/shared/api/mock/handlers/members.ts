import { http, HttpResponse } from 'msw'
import { FALLBACK_TEAMS, sortTeams } from '../../../lib/team'

let mockMembers = [
  { id: '1', name: '김리더', email: 'admin@yanus.kr', team: '1팀', role: 'ADMIN', status: 'ACTIVE', online: true },
  { id: '2', name: '박팀장', email: 'lead@yanus.kr', team: '2팀', role: 'TEAM_LEAD', status: 'ACTIVE', online: true },
  { id: '3', name: '이멤버', email: 'user@yanus.kr', team: '3팀', role: 'MEMBER', status: 'ACTIVE', online: false },
  { id: '4', name: '최개발', email: 'dev@yanus.kr', team: '1팀', role: 'MEMBER', status: 'ACTIVE', online: true },
  { id: '5', name: '정보안', email: 'sec@yanus.kr', team: '4팀', role: 'MEMBER', status: 'INACTIVE', online: false },
]

let mockTeams = [...FALLBACK_TEAMS]

export function resetMembersMockData() {
  mockMembers = [
    { id: '1', name: '김리더', email: 'admin@yanus.kr', team: '1팀', role: 'ADMIN', status: 'ACTIVE', online: true },
    { id: '2', name: '박팀장', email: 'lead@yanus.kr', team: '2팀', role: 'TEAM_LEAD', status: 'ACTIVE', online: true },
    { id: '3', name: '이멤버', email: 'user@yanus.kr', team: '3팀', role: 'MEMBER', status: 'ACTIVE', online: false },
    { id: '4', name: '최개발', email: 'dev@yanus.kr', team: '1팀', role: 'MEMBER', status: 'ACTIVE', online: true },
    { id: '5', name: '정보안', email: 'sec@yanus.kr', team: '4팀', role: 'MEMBER', status: 'INACTIVE', online: false },
  ]
  mockTeams = [...FALLBACK_TEAMS]
}

export const membersHandlers = [
  http.get('/api/v1/members', ({ request }) => {
    const url = new URL(request.url)
    const teamName = url.searchParams.get('teamName')
    const role = url.searchParams.get('role')
    const filtered = mockMembers.filter((member) => {
      const matchesTeam = !teamName || member.team === teamName
      const matchesRole = !role || member.role === role
      return matchesTeam && matchesRole
    })

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),

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

  http.patch('/api/v1/members/:id/team', async ({ params, request }) => {
    const body = await request.json() as { teamId: number }
    const team = mockTeams.find((item) => item.id === body.teamId)
    if (!team) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '팀을 찾을 수 없습니다', data: null }, { status: 404 })
    }

    mockMembers = mockMembers.map((m) =>
      m.id === params.id ? { ...m, team: team.name } : m,
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

  http.post('/api/v1/members/:id/reset-password', ({ params }) =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { temporaryPassword: `temp-${params.id}-pw` },
    })),

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
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: sortTeams(mockTeams) }),
  ),

  http.get('/api/v1/teams/:id', ({ params }) => {
    const team = mockTeams.find((t) => t.id === Number(params.id))
    if (!team) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '팀을 찾을 수 없습니다', data: null }, { status: 404 })
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: team })
  }),

  http.post('/api/v1/teams', async ({ request }) => {
    const body = await request.json() as { name?: string }
    const name = body.name?.trim()

    if (!name) {
      return HttpResponse.json({ code: 'BAD_REQUEST', message: '팀 이름을 입력해 주세요', data: null }, { status: 400 })
    }

    if (mockTeams.some((team) => team.name === name)) {
      return HttpResponse.json({ code: 'CONFLICT', message: '이미 존재하는 팀입니다', data: null }, { status: 409 })
    }

    const nextTeam = {
      id: Math.max(0, ...mockTeams.map((team) => team.id)) + 1,
      name,
    }

    mockTeams = [...mockTeams, nextTeam]

    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: nextTeam })
  }),

  http.delete('/api/v1/teams/:teamId', ({ params }) => {
    const teamId = Number(params.teamId)
    const team = mockTeams.find((item) => item.id === teamId)

    if (!team) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '팀을 찾을 수 없습니다', data: null }, { status: 404 })
    }

    if (mockMembers.some((member) => member.team === team.name)) {
      return HttpResponse.json(
        { code: 'TEAM_IN_USE', message: '멤버가 남아 있는 팀은 삭제할 수 없습니다', data: null },
        { status: 409 },
      )
    }

    mockTeams = mockTeams.filter((item) => item.id !== teamId)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
]
