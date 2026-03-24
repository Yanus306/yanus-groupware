import { http, HttpResponse } from 'msw'
import type { User } from '../../../../entities/user/model/types'

const INITIAL_USERS: User[] = [
  { id: '1', name: '김리더', email: 'admin@yanus.kr', team: 'BACKEND', role: 'ADMIN', status: 'ACTIVE', online: true },
  { id: '2', name: '박팀장', email: 'lead@yanus.kr', team: 'FRONTEND', role: 'TEAM_LEAD', status: 'ACTIVE', online: true },
  { id: '3', name: '이멤버', email: 'user@yanus.kr', team: 'AI', role: 'MEMBER', status: 'ACTIVE', online: false },
  { id: '5', name: '정보안', email: 'sec@yanus.kr', team: 'SECURITY', role: 'MEMBER', status: 'INACTIVE', online: false },
]

let mockUsers = [...INITIAL_USERS]

const INITIAL_CREDENTIALS: Record<string, { userId: string; password: string }> = {
  'admin@yanus.kr': { userId: '1', password: 'password' },
  'lead@yanus.kr': { userId: '2', password: 'password' },
  'user@yanus.kr': { userId: '3', password: 'password' },
  'sec@yanus.kr': { userId: '5', password: 'password' },
}

let validCredentials: Record<string, { userId: string; password: string }> = { ...INITIAL_CREDENTIALS }

export function resetAuthMockData() {
  mockUsers = [...INITIAL_USERS]
  validCredentials = { ...INITIAL_CREDENTIALS }
}

export function getAuthMockUserByAuthorization(authorization: string | null): User {
  if (!authorization?.startsWith('Bearer ')) {
    return mockUsers[0]
  }

  const token = authorization.replace('Bearer ', '')
  const userId = token.replace('mock-token-', '')

  return mockUsers.find((user) => user.id === userId) ?? mockUsers[0]
}

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const match = validCredentials[body.email]
    if (!match || body.password !== match.password) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다', data: null },
        { status: 401 },
      )
    }

    const member = mockUsers.find((user) => user.id === match.userId)
    if (member?.status === 'INACTIVE') {
      return HttpResponse.json(
        { code: 'MEMBER_INACTIVE', message: '비활성화된 계정입니다', data: null },
        { status: 403 },
      )
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { accessToken: `mock-token-${match.userId}`, refreshToken: `refresh-${match.userId}`, tokenType: 'Bearer' },
    })
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; password: string; teamId: number }
    if (validCredentials[body.email]) {
      return HttpResponse.json(
        { code: 'CONFLICT', message: '이미 가입된 이메일입니다', data: null },
        { status: 409 },
      )
    }

    const teamMap: Record<number, User['team']> = { 1: 'BACKEND', 2: 'FRONTEND', 3: 'AI', 4: 'SECURITY' }
    const newId = String(mockUsers.length + 1)
    const newUser: User = {
      id: newId,
      name: body.name,
      email: body.email,
      team: teamMap[body.teamId] ?? 'BACKEND',
      role: 'MEMBER',
      online: true,
    }

    mockUsers = [...mockUsers, newUser]
    validCredentials = {
      ...validCredentials,
      [body.email]: { userId: newId, password: body.password },
    }

    return HttpResponse.json({ code: 'SUCCESS', message: 'created', data: null }, { status: 201 })
  }),

  http.get('/api/v1/auth/me', ({ request }) => {
    const authorization = request.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '인증이 필요합니다', data: null },
        { status: 401 },
      )
    }
    const user = getAuthMockUserByAuthorization(authorization)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: user })
  }),

  http.post('/api/v1/auth/logout', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
]
