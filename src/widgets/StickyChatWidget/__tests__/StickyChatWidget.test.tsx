import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StickyChatWidget } from '../StickyChatWidget'

describe('StickyChatWidget', () => {
  it('토글 버튼이 렌더링된다', () => {
    render(<StickyChatWidget />)
    expect(screen.getByTitle('AI Assistant')).toBeInTheDocument()
  })

  it('초기에는 채팅 팝업이 닫혀있다', () => {
    render(<StickyChatWidget />)
    expect(screen.queryByText('yANUs Assistant')).not.toBeInTheDocument()
  })

  it('토글 버튼 클릭 시 팝업이 열린다', () => {
    render(<StickyChatWidget />)
    fireEvent.click(screen.getByTitle('AI Assistant'))
    expect(screen.getByText('yANUs Assistant')).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 팝업이 닫힌다', () => {
    render(<StickyChatWidget />)
    fireEvent.click(screen.getByTitle('AI Assistant'))
    expect(screen.getByText('yANUs Assistant')).toBeInTheDocument()

    const closeBtn = document.querySelector('.close-btn') as HTMLButtonElement
    fireEvent.click(closeBtn)
    expect(screen.queryByText('yANUs Assistant')).not.toBeInTheDocument()
  })

  it('메시지를 입력하고 전송하면 채팅창에 표시된다', () => {
    render(<StickyChatWidget />)
    fireEvent.click(screen.getByTitle('AI Assistant'))

    const input = screen.getByPlaceholderText('Ask about your files...')
    fireEvent.change(input, { target: { value: '안녕하세요' } })

    const sendBtn = document.querySelector('.send-btn') as HTMLButtonElement
    fireEvent.click(sendBtn)

    expect(screen.getByText('안녕하세요')).toBeInTheDocument()
  })

  it('전송 후 입력창이 비워진다', () => {
    render(<StickyChatWidget />)
    fireEvent.click(screen.getByTitle('AI Assistant'))

    const input = screen.getByPlaceholderText('Ask about your files...')
    fireEvent.change(input, { target: { value: '테스트 메시지' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(input).toHaveValue('')
  })

  it('빈 메시지는 전송되지 않는다', () => {
    render(<StickyChatWidget />)
    fireEvent.click(screen.getByTitle('AI Assistant'))

    const input = screen.getByPlaceholderText('Ask about your files...')
    fireEvent.change(input, { target: { value: '  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(document.querySelectorAll('.chat-msg')).toHaveLength(0)
    expect(screen.getByText('yANUs Assistant')).toBeInTheDocument()
  })
})
