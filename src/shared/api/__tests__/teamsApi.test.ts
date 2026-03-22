import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getTeams, getTeam } from '../teamsApi'

const server = setupServer(
  http.get('/api/v1/teams', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: 1, name: 'BACKEND' },
        { id: 2, name: 'FRONTEND' },
        { id: 3, name: 'AI' },
        { id: 4, name: 'SECURITY' },
      ],
    }),
  ),
  http.get('/api/v1/teams/:id', ({ params }) =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: { id: Number(params.id), name: 'BACKEND' },
    }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('teamsApi', () => {
  it('getTeams() 팀 목록을 반환한다', async () => {
    const teams = await getTeams()
    expect(teams).toHaveLength(4)
    expect(teams[0]).toMatchObject({ id: 1, name: 'BACKEND' })
  })

  it('getTeam() 특정 팀 정보를 반환한다', async () => {
    const team = await getTeam(1)
    expect(team).toMatchObject({ id: 1, name: 'BACKEND' })
  })
})
