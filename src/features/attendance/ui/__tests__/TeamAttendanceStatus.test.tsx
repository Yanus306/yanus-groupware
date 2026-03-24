import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TeamAttendanceStatus } from '../TeamAttendanceStatus'
import type { User } from '../../../../entities/user/model/types'
import type { AttendanceRecord } from '../../../../shared/api/attendanceApi'

const TODAY = '2026-03-23'

const members: User[] = [
  { id: '1', name: '김리더', email: 'a@test.com', team: '1팀', role: 'ADMIN' },
  { id: '2', name: '박팀장', email: 'b@test.com', team: '2팀', role: 'TEAM_LEAD' },
  { id: '3', name: '이개발', email: 'c@test.com', team: '3팀', role: 'MEMBER' },
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
  })

  it('요약 카운트를 올바르게 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
    const ones = screen.getAllByText('1')
    expect(ones.length).toBe(3)
  })

  it('records가 비어있으면 전체 미출근으로 표시한다', () => {
    render(<TeamAttendanceStatus members={members} records={[]} date={TODAY} />)
    expect(screen.getByText('3')).toBeInTheDocument() // 미출근 카운트
  })

  describe('상태 필터', () => {
    it('기본으로 근무 중인 멤버만 표시된다', () => {
      render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
      expect(screen.getByText('김리더')).toBeInTheDocument()
      expect(screen.queryByText('박팀장')).not.toBeInTheDocument()
      expect(screen.queryByText('이개발')).not.toBeInTheDocument()
    })

    it('퇴근 필터 클릭 시 퇴근한 멤버만 표시된다', () => {
      render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
      fireEvent.click(screen.getByRole('button', { name: /퇴근/ }))
      expect(screen.queryByText('김리더')).not.toBeInTheDocument()
      expect(screen.getByText('박팀장')).toBeInTheDocument()
      expect(screen.queryByText('이개발')).not.toBeInTheDocument()
    })

    it('미출근 필터 클릭 시 미출근 멤버만 표시된다', () => {
      render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
      fireEvent.click(screen.getByRole('button', { name: /미출근/ }))
      expect(screen.queryByText('김리더')).not.toBeInTheDocument()
      expect(screen.queryByText('박팀장')).not.toBeInTheDocument()
      expect(screen.getByText('이개발')).toBeInTheDocument()
    })

    it('근무 중 필터 클릭 시 근무 중인 멤버만 표시된다', () => {
      render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
      fireEvent.click(screen.getByRole('button', { name: /퇴근/ }))
      fireEvent.click(screen.getByRole('button', { name: /근무 중/ }))
      expect(screen.getByText('김리더')).toBeInTheDocument()
      expect(screen.queryByText('박팀장')).not.toBeInTheDocument()
    })

    it('필터 버튼이 3개 렌더링된다', () => {
      render(<TeamAttendanceStatus members={members} records={records} date={TODAY} />)
      expect(screen.getByRole('button', { name: /근무 중/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /퇴근/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /미출근/ })).toBeInTheDocument()
    })

    it('records가 비어있을 때 미출근 필터로 전체 멤버가 표시된다', () => {
      render(<TeamAttendanceStatus members={members} records={[]} date={TODAY} />)
      fireEvent.click(screen.getByRole('button', { name: /미출근/ }))
      expect(screen.getByText('김리더')).toBeInTheDocument()
      expect(screen.getByText('박팀장')).toBeInTheDocument()
      expect(screen.getByText('이개발')).toBeInTheDocument()
    })
  })
})
