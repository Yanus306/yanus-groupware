import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('children 텍스트를 렌더링한다', () => {
    render(<Button>클릭</Button>)
    expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument()
  })

  it('onClick 핸들러를 호출한다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('variant="primary" 기본값으로 렌더링된다', () => {
    render(<Button>기본</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('variant="secondary" 클래스를 적용한다', () => {
    render(<Button variant="secondary">보조</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-secondary')
  })

  it('variant="danger" 클래스를 적용한다', () => {
    render(<Button variant="danger">삭제</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-danger')
  })

  it('disabled 상태에서 클릭이 차단된다', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>비활성</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('loading 상태에서 로딩 텍스트를 표시한다', () => {
    render(<Button loading>저장</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('로딩 중...')
  })

  it('size="sm" 클래스를 적용한다', () => {
    render(<Button size="sm">작은 버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-sm')
  })

  it('size="lg" 클래스를 적용한다', () => {
    render(<Button size="lg">큰 버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-lg')
  })
})
