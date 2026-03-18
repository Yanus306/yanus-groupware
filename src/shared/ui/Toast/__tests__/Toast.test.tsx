import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Toast } from '../Toast'

describe('Toast', () => {
  it('message를 렌더링한다', () => {
    render(<Toast message="저장되었습니다" onClose={() => {}} />)
    expect(screen.getByText('저장되었습니다')).toBeInTheDocument()
  })

  it('type="success" 클래스를 적용한다', () => {
    render(<Toast message="성공" type="success" onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('toast-success')
  })

  it('type="error" 클래스를 적용한다', () => {
    render(<Toast message="오류" type="error" onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('toast-error')
  })

  it('type="info" 가 기본값이다', () => {
    render(<Toast message="정보" onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('toast-info')
  })

  it('duration 후 onClose를 호출한다', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast message="알림" duration={1000} onClose={onClose} />)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onClose).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Toast message="알림" onClose={onClose} />)
    screen.getByRole('button', { name: '닫기' }).click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
