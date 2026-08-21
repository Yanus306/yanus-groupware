import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { attendanceHandlers, resetAttendanceMockData } from '../attendance'

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetAttendanceMockData())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MSW 출석 핸들러 — 멤버별 근무 일정', () => {
  it('개인 일정 조회와 저장이 로그인 멤버별로 격리된다', async () => {
    const memberHeaders = { Authorization: 'Bearer mock-token-3' }
    const adminHeaders = { Authorization: 'Bearer mock-token-1' }

    const memberBeforeResponse = await fetch('/api/v1/work-schedules/me', { headers: memberHeaders })
    const memberBeforeBody = await memberBeforeResponse.json() as {
      data: Array<{ dayOfWeek: string; startTime: string }>
    }
    const memberMonday = memberBeforeBody.data.find((schedule) => schedule.dayOfWeek === 'MONDAY')

    expect(memberBeforeResponse.status).toBe(200)
    expect(memberBeforeBody.data.length).toBeGreaterThan(0)
    expect(memberMonday?.startTime).not.toBe('09:00:00')

    const updateResponse = await fetch('/api/v1/work-schedules', {
      method: 'PUT',
      headers: { ...memberHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayOfWeek: 'MONDAY',
        startTime: '08:30:00',
        endTime: '17:30:00',
        weekPattern: 'EVERY',
      }),
    })

    expect(updateResponse.status).toBe(200)

    const memberAfterResponse = await fetch('/api/v1/work-schedules/me', { headers: memberHeaders })
    const adminAfterResponse = await fetch('/api/v1/work-schedules/me', { headers: adminHeaders })
    const memberAfterBody = await memberAfterResponse.json() as {
      data: Array<{ dayOfWeek: string; startTime: string }>
    }
    const adminAfterBody = await adminAfterResponse.json() as {
      data: Array<{ dayOfWeek: string; startTime: string }>
    }

    expect(memberAfterBody.data.find((schedule) => schedule.dayOfWeek === 'MONDAY')?.startTime).toBe('08:30:00')
    expect(adminAfterBody.data.find((schedule) => schedule.dayOfWeek === 'MONDAY')?.startTime).toBe('09:00:00')
  })

  it('인증되지 않은 일정 요청은 기본 사용자로 fallback하지 않는다', async () => {
    const response = await fetch('/api/v1/work-schedules/me')
    expect(response.status).toBe(401)
  })

  it('팀장 출석 조회는 요청 팀과 자신의 팀 범위만 반환한다', async () => {
    const forbiddenResponse = await fetch('/api/v1/attendances?date=2026-08-22&teamId=1', {
      headers: { Authorization: 'Bearer mock-token-2' },
    })
    const ownTeamResponse = await fetch('/api/v1/attendances?date=2026-08-22&teamId=2', {
      headers: { Authorization: 'Bearer mock-token-2' },
    })

    expect(forbiddenResponse.status).toBe(403)
    expect(ownTeamResponse.status).toBe(200)
    const body = await ownTeamResponse.json() as { data: Array<{ memberId: number }> }
    expect(body.data.every((record) => record.memberId === 2)).toBe(true)
  })

  it('팀 일정 이벤트는 memberId의 실제 소속 팀으로 분류한다', async () => {
    const response = await fetch('/api/v1/work-schedule-events/team/1?startDate=2026-04-02&endDate=2026-04-02', {
      headers: { Authorization: 'Bearer mock-token-1' },
    })
    const body = await response.json() as { data: Array<{ memberId: number; teamName: string }> }

    expect(response.status).toBe(200)
    expect(body.data).toContainEqual(expect.objectContaining({ memberId: 4, teamName: '1팀' }))
  })
})
