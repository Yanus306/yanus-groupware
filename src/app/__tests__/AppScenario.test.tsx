import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { getTodayStr } from '../../shared/lib/date'

const today = getTodayStr()

const initialTeams = [
  { id: 1, name: '1팀' },
  { id: 2, name: '2팀' },
  { id: 3, name: '3팀' },
]

const initialMembers = [
  { id: 1, name: '관리자', email: 'admin@yanus.kr', role: 'ADMIN', status: 'ACTIVE', team: '1팀' },
  { id: 2, name: '김멤버', email: 'member@yanus.kr', role: 'MEMBER', status: 'ACTIVE', team: '1팀' },
  { id: 3, name: '박팀장', email: 'lead@yanus.kr', role: 'TEAM_LEAD', status: 'ACTIVE', team: '2팀' },
]

let currentRole: 'ADMIN' | 'TEAM_LEAD' = 'ADMIN'
let teams = [...initialTeams]
let members = [...initialMembers]
let tasks = [
  {
    id: 1,
    title: '배포 준비',
    date: today,
    time: '10:00:00',
    priority: 'HIGH',
    done: false,
    isTeamTask: false,
    assigneeId: null,
    assigneeName: null,
    memberIds: [],
    memberNames: [],
  },
]
let events = [
  {
    id: 1,
    title: '운영진 회의',
    startDate: today,
    startTime: '13:00:00',
    endDate: today,
    endTime: '14:00:00',
    createdById: 1,
    createdByName: '관리자',
  },
]

const server = setupServer(
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
      },
    }),
  ),
  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        id: currentRole === 'ADMIN' ? 1 : 3,
        name: currentRole === 'ADMIN' ? '관리자' : '박팀장',
        email: currentRole === 'ADMIN' ? 'admin@yanus.kr' : 'lead@yanus.kr',
        team: currentRole === 'ADMIN' ? '1팀' : '2팀',
        role: currentRole,
      },
    }),
  ),
  http.get('/api/v1/members', ({ request }) => {
    const url = new URL(request.url)
    const teamName = url.searchParams.get('teamName')
    const filtered = teamName ? members.filter((member) => member.team === teamName) : members
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),
  http.patch('/api/v1/members/:memberId/team', async ({ params, request }) => {
    const body = await request.json() as { teamId: number }
    const nextTeam = teams.find((team) => team.id === body.teamId)
    members = members.map((member) =>
      String(member.id) === params.memberId
        ? { ...member, team: nextTeam?.name ?? member.team }
        : member,
    )
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: {} })
  }),
  http.get('/api/v1/teams', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: teams }),
  ),
  http.get('/api/v1/tasks', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const filtered = type === 'TEAM'
      ? tasks.filter((task) => task.isTeamTask)
      : tasks.filter((task) => !task.isTeamTask)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: filtered })
  }),
  http.patch('/api/v1/tasks/:taskId/done', ({ params }) => {
    tasks = tasks.map((task) =>
      String(task.id) === params.taskId ? { ...task, done: !task.done } : task,
    )
    const updated = tasks.find((task) => String(task.id) === params.taskId)
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: updated })
  }),
  http.get('/api/v1/events', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: events }),
  ),
  http.get('/channels', () =>
    HttpResponse.json([{ id: '1', name: 'General', lastMessage: '안녕하세요' }]),
  ),
  http.get('/channels/:channelId/messages', () =>
    HttpResponse.json([
      {
        id: 'm1',
        channelId: '1',
        userId: '1',
        userName: '관리자',
        content: '안녕하세요',
        type: 'text',
        timestamp: '2026-03-26T09:00:00.000Z',
      },
    ]),
  ),
  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
  ),
  http.get('/api/v1/attendances', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
  ),
  http.get('/api/v1/attendances/me', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
  ),
  http.post('/api/v1/auth/logout', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: {} }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

beforeEach(() => {
  currentRole = 'ADMIN'
  teams = [...initialTeams]
  members = [...initialMembers]
  tasks = [
    {
      id: 1,
      title: '배포 준비',
      date: today,
      time: '10:00:00',
      priority: 'HIGH',
      done: false,
      isTeamTask: false,
      assigneeId: null,
      assigneeName: null,
      memberIds: [],
      memberNames: [],
    },
  ]
  events = [
    {
      id: 1,
      title: '운영진 회의',
      startDate: today,
      startTime: '13:00:00',
      endDate: today,
      endTime: '14:00:00',
      createdById: 1,
      createdByName: '관리자',
    },
  ]
  window.history.replaceState({}, '', '/login')
})

describe('핵심 사용자 흐름', () => {
  it('로그인 후 대시보드, 멤버 관리, 팀 변경, 로그아웃 흐름이 동작한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('이메일'), 'admin@yanus.kr')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('오늘 일정')).toBeInTheDocument()
    expect(await screen.findByText('운영진 회의')).toBeInTheDocument()
    expect(await screen.findByText('배포 준비')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /배포 준비 완료 처리/ }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '완료됨' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /운영진 회의/ }))
    expect(await screen.findByText('오늘 일정 상세')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '닫기' }))

    await user.click(screen.getByTitle('관리자'))
    await user.click(screen.getByRole('button', { name: '멤버 관리' }))
    expect(await screen.findByText('멤버 목록')).toBeInTheDocument()

    const memberRow = screen.getByRole('row', { name: /김멤버/ })
    await user.click(within(memberRow).getByRole('button', { name: /팀 변경/ }))
    const teamOption = screen.getAllByText('2팀').find((element) => element.closest('.admin-role-option'))
    await user.click(teamOption!.closest('.admin-role-option') as HTMLElement)
    await user.click(screen.getByRole('button', { name: '변경 확인' }))

    await waitFor(() => {
      expect(screen.getByText(/김멤버의 팀을 2팀으로 변경했습니다/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(await screen.findByText('동아리 그룹웨어')).toBeInTheDocument()
  })

  it('팀장 로그인 시 팀 관리만 보이고 관리자 메뉴는 보이지 않는다', async () => {
    currentRole = 'TEAM_LEAD'
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('이메일'), 'lead@yanus.kr')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('오늘 일정')).toBeInTheDocument()
    expect(screen.getByText('팀 관리')).toBeInTheDocument()
    expect(screen.queryByTitle('관리자')).not.toBeInTheDocument()

    await user.click(screen.getByText('팀 관리'))
    expect(await screen.findByText('팀장은 같은 팀 멤버를 확인하고 팀 이동만 관리할 수 있습니다.')).toBeInTheDocument()
  })
})
