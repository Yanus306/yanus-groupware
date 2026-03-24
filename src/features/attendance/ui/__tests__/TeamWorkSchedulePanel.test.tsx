import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamWorkSchedulePanel } from '../TeamWorkSchedulePanel'
import type { MemberWorkScheduleItem } from '../../../../shared/api/attendanceApi'

const schedules: MemberWorkScheduleItem[] = [
  {
    memberId: 1,
    memberName: '김리더',
    teamName: 'BACKEND',
    workSchedules: [
      { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
      { id: 2, dayOfWeek: 'FRIDAY', startTime: '09:30:00', endTime: '18:30:00' },
    ],
  },
]

describe('TeamWorkSchedulePanel', () => {
  it('멤버 이름과 팀명이 렌더링된다', () => {
    render(<TeamWorkSchedulePanel schedules={schedules} />)
    expect(screen.getByText('김리더')).toBeInTheDocument()
    expect(screen.getByText('BACKEND')).toBeInTheDocument()
  })

  it('요일별 근무 시간 배지가 렌더링된다', () => {
    render(<TeamWorkSchedulePanel schedules={schedules} />)
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('09:00 - 18:00')).toBeInTheDocument()
  })

  it('데이터가 없으면 빈 상태 메시지를 보여준다', () => {
    render(<TeamWorkSchedulePanel schedules={[]} />)
    expect(screen.getByText('표시할 근무 일정이 없습니다.')).toBeInTheDocument()
  })
})
