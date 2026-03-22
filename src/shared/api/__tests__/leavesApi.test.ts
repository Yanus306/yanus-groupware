import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMyLeaves, createLeave, getAdminLeaves, approveLeave, rejectLeave } from '../leavesApi'

const MOCK_LEAVE = {
  id: 1,
  memberId: 1,
  memberName: '정용태',
  category: 'VACATION' as const,
  detail: '개인 연차',
  date: '2026-03-25',
  status: 'PENDING' as const,
  submittedAt: '2026-03-23T10:00:00',
  reviewedAt: null,
}

const server = setupServer(
  http.get('/api/v1/leaves', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [MOCK_LEAVE] }),
  ),
  http.post('/api/v1/leaves', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(
      { code: 'SUCCESS', message: 'ok', data: { ...MOCK_LEAVE, ...body } },
      { status: 201 },
    )
  }),
  http.get('/api/v1/leaves/admin', ({ request }) => {
    const url = new URL(request.url)
    const teamId = url.searchParams.get('teamId')
    if (!teamId) {
      return HttpResponse.json({ code: 'BAD_REQUEST', message: 'teamId 필수', data: null }, { status: 400 })
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [MOCK_LEAVE] })
  }),
  http.patch('/api/v1/leaves/:id/approve', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { ...MOCK_LEAVE, status: 'APPROVED', reviewedAt: '2026-03-23T11:00:00' } }),
  ),
  http.patch('/api/v1/leaves/:id/reject', () =>
    HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { ...MOCK_LEAVE, status: 'REJECTED', reviewedAt: '2026-03-23T11:00:00' } }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('leavesApi', () => {
  it('getMyLeaves() 내 휴가 신청 목록을 반환한다', async () => {
    const leaves = await getMyLeaves()
    expect(leaves).toHaveLength(1)
    expect(leaves[0]).toMatchObject({ id: 1, category: 'VACATION', status: 'PENDING' })
  })

  it('createLeave() 휴가 신청을 생성하고 반환한다', async () => {
    const leave = await createLeave({ category: 'SICK_LEAVE', detail: '감기', date: '2026-03-26' })
    expect(leave).toMatchObject({ category: 'SICK_LEAVE', detail: '감기' })
    expect(leave.id).toBeTruthy()
  })

  it('getAdminLeaves() teamId로 팀 휴가 목록을 반환한다', async () => {
    const leaves = await getAdminLeaves(1)
    expect(leaves).toHaveLength(1)
    expect(leaves[0].memberName).toBe('정용태')
  })

  it('approveLeave() 휴가를 승인하고 APPROVED 상태를 반환한다', async () => {
    const approved = await approveLeave(1)
    expect(approved.status).toBe('APPROVED')
    expect(approved.reviewedAt).not.toBeNull()
  })

  it('rejectLeave() 휴가를 반려하고 REJECTED 상태를 반환한다', async () => {
    const rejected = await rejectLeave(1)
    expect(rejected.status).toBe('REJECTED')
    expect(rejected.reviewedAt).not.toBeNull()
  })
})
