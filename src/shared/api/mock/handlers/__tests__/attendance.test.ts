import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../index'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
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
})
