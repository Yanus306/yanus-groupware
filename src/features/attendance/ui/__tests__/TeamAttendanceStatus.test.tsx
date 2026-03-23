import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamAttendanceStatus } from '../TeamAttendanceStatus'
import type { User } from '../../../../entities/user/model/types'
import type { AttendanceRecord } from '../../../../shared/api/attendanceApi'

const TODAY = '2026-03-23'

const members: User[] = [
  { id: '1', name: '김리더', email: 'a@test.com', team: 'BACKEND', role: 'ADMIN' },
  { id: '2', name: '박팀장', email: 'b@test.com', team: 'FRONTEND', role: 'TEAM_LEAD' },
  { id: '3', name: '이개발', email: 'c@test.com', team: 'AI', role: 'MEMBER' },
]

const records: AttendanceRecord[] = [
  {
    id: 1, memberId: 1, memberName: '김리더',
    workDate: TODAY, checkInTime: `${TODAY}T09:00:00`, checkOutTime: null, status: 'WORKING',
  },
  {
    id: 2, memberId: 2, memberName: '박팀장',
    workDate: TODAY, checkInTime: `${TODAY}T09:30:00`, checkOutTime: `${TODAY}T18:00:00`, status: 'LEFT',
  },
]

describe('TeamAttendanceStatus', () => {
  it('팀원 목록이 렌더링된다', () => {
    render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
    expect(screen.getByText('김리더')).toBeInTheDocument()
    expect(screen.getByText('박팀장')).toBeInTheDocument()
    expect(screen.getByText('이개발')).toBeInTheDocument()
  })

  it('근무 중 상태를 올바르게 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
    expect(screen.getByText('근무 중')).toBeInTheDocument()
  })

  it('퇴근 상태를 올바르게 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
    expect(screen.getByText('퇴근')).toBeInTheDocument()
  })

  it('미출근 상태를 올바르게 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
    expect(screen.getByText('미출근')).toBeInTheDocument()
  })

  it('요약 카운트를 올바르게 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
    // 근무 중 1명, 퇴근 1명, 미출근 1명
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('records가 비어있으면 전체 미출근으로 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={[]} date={TODAY} />)
    const badges = screen.getAllByText('미출근')
    expect(badges).toHaveLength(3)
  })
})
