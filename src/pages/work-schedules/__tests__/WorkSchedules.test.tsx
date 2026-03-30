import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkSchedules } from '../index'

vi.mock('../../../features/attendance/ui', () => ({
  SetWorkDaysPersonal: () => <div data-testid="work-schedule-editor">mock-editor</div>,
}))

describe('WorkSchedules 페이지', () => {
  it('근무 일정 페이지는 캘린더 편집 카드만 렌더링한다', () => {
    render(<WorkSchedules />)

    expect(screen.getByText('내 근무 일정')).toBeInTheDocument()
    expect(screen.getByText('캘린더에서 반복 근무 일정을 바로 확인하고 수정할 수 있습니다.')).toBeInTheDocument()
    expect(
      screen.getByText('근무 일정 조회와 편집을 한 화면의 캘린더로 단순화했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('work-schedule-editor')).toBeInTheDocument()
    expect(screen.queryByText('근무 일정 조회')).not.toBeInTheDocument()
  })
})
