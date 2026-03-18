import { http, HttpResponse } from 'msw'

const MOCK_USERS = [
  { id: '1', name: '김리더', team: 'dev', role: 'leader', online: true },
  { id: '2', name: '박팀장', team: 'design', role: 'team_lead', online: true },
  { id: '3', name: '이멤버', team: 'marketing', role: 'member', online: false },
]

const VALID_CREDENTIALS: Record<string, { userId: string }> = {
  'admin@yanus.kr': { userId: '1' },
  'lead@yanus.kr': { userId: '2' },
  'user@yanus.kr': { userId: '3' },
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const match = VALID_CREDENTIALS[body.email]
    if (!match || body.password !== 'password') {
      return HttpResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 },
      )
    }
    return HttpResponse.json({ accessToken: `mock-token-${match.userId}` })
  }),

  http.get('/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const userId = auth.replace('Bearer mock-token-', '') || '1'
    const user = MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0]
    return HttpResponse.json(user)
  }),
]
