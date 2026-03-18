import { http, HttpResponse } from 'msw'
import type { User } from '../../../../entities/user/model/types'

const INITIAL_USERS: User[] = [
  { id: '1', name: '김리더', team: 'dev', role: 'leader', online: true },
  { id: '2', name: '박팀장', team: 'design', role: 'team_lead', online: true },
  { id: '3', name: '이멤버', team: 'marketing', role: 'member', online: false },
]

let mockUsers = [...INITIAL_USERS]

const INITIAL_CREDENTIALS: Record<string, { userId: string; password: string }> = {
  'admin@yanus.kr': { userId: '1', password: 'password' },
  'lead@yanus.kr': { userId: '2', password: 'password' },
  'user@yanus.kr': { userId: '3', password: 'password' },
}

let validCredentials: Record<string, { userId: string; password: string }> = { ...INITIAL_CREDENTIALS }

export function resetAuthMockData() {
  mockUsers = [...INITIAL_USERS]
  validCredentials = { ...INITIAL_CREDENTIALS }
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const match = validCredentials[body.email]
    if (!match || body.password !== match.password) {
      return HttpResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 },
      )
    }
    return HttpResponse.json({ accessToken: `mock-token-${match.userId}` })
  }),

  http.post('/auth/register', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; password: string; team: User['team'] }
    if (validCredentials[body.email]) {
      return HttpResponse.json(
        { message: '이미 가입된 이메일입니다' },
        { status: 409 },
      )
    }

    const newId = String(mockUsers.length + 1)
    const newUser: User = {
      id: newId,
      name: body.name,
      team: body.team,
      role: 'member',
      online: true,
    }

    mockUsers = [...mockUsers, newUser]
    validCredentials = {
      ...validCredentials,
      [body.email]: { userId: newId, password: body.password },
    }

    return HttpResponse.json({ accessToken: `mock-token-${newId}` }, { status: 201 })
  }),

  http.get('/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const userId = auth.replace('Bearer mock-token-', '') || '1'
    const user = mockUsers.find((u) => u.id === userId) ?? mockUsers[0]
    return HttpResponse.json(user)
  }),
]
