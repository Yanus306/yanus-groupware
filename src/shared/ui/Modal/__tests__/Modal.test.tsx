import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  it('open=true일 때 title을 렌더링한다', () => {
    render(<Modal open title="테스트 모달" onClose={() => {}}>내용</Modal>)
    expect(screen.getByText('테스트 모달')).toBeInTheDocument()
  })

  it('open=false일 때 렌더링하지 않는다', () => {
    render(<Modal open={false} title="숨긴 모달" onClose={() => {}}>내용</Modal>)
    expect(screen.queryByText('숨긴 모달')).not.toBeInTheDocument()
  })

  it('children 내용을 렌더링한다', () => {
    render(<Modal open title="모달" onClose={() => {}}>모달 본문</Modal>)
    expect(screen.getByText('모달 본문')).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Modal open title="모달" onClose={onClose}>내용</Modal>)
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('오버레이 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Modal open title="모달" onClose={onClose}>내용</Modal>)
    fireEvent.click(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('모달 본문 클릭은 onClose를 호출하지 않는다', () => {
    const onClose = vi.fn()
    render(<Modal open title="모달" onClose={onClose}>내용</Modal>)
    fireEvent.click(screen.getByTestId('modal-content'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
