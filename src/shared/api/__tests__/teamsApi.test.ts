import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createTeam, deleteTeam, getTeams, getTeam } from '../teamsApi'

const server = setupServer(
  http.get('/api/v1/teams', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: 1, name: '1팀' },
        { id: 2, name: '2팀' },
        { id: 3, name: '3팀' },
        { id: 4, name: '4팀' },
      ],
    }),
  ),
  http.get('/api/v1/teams/:id', ({ params }) =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: Number(params.id), name: '1팀' },
    }),
  ),
  http.post('/api/v1/teams', async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: 5, name: body.name },
    }, { status: 201 })
  }),
  http.delete('/api/v1/teams/:teamId', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('teamsApi', () => {
  it('getTeams() 팀 목록을 반환한다', async () => {
    const teams = await getTeams()
    expect(teams).toHaveLength(4)
    expect(teams[0]).toMatchObject({ id: 1, name: '1팀' })
  })

  it('getTeam() 특정 팀 정보를 반환한다', async () => {
    const team = await getTeam(1)
    expect(team).toMatchObject({ id: 1, name: '1팀' })
  })

  it('createTeam() 새 팀을 생성한다', async () => {
    const team = await createTeam('5팀')
    expect(team).toMatchObject({ id: 5, name: '5팀' })
  })

  it('deleteTeam() 팀을 삭제한다', async () => {
    await expect(deleteTeam(4)).resolves.toBeNull()
  })
})
