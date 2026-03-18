import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { attendanceHandlers } from '../mock/handlers/attendance'
import { getAttendance, clockIn, clockOut } from '../attendanceApi'

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('attendanceApi', () => {
  it('getAttendance() 출퇴근 기록 목록을 반환한다', async () => {
    const records = await getAttendance()
    expect(records.length).toBeGreaterThan(0)
    expect(records[0]).toMatchObject({ id: '1', userId: '1', clockIn: '09:02' })
  })

  it('clockIn() 출근 기록을 생성한다', async () => {
    const result = await clockIn()
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('clockIn')
    expect(result.status).toBe('working')
  })

  it('clockOut() 퇴근 시간을 기록한다', async () => {
    const result = await clockOut()
    expect(result).toHaveProperty('clockOut')
    expect(result.status).toBe('done')
  })
})
