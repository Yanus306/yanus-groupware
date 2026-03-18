import { http, HttpResponse } from 'msw'

const mockMembers = [
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
]
