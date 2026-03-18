import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { setupServer } from 'msw/node'
import { chatHandlers } from '../../shared/api/mock/handlers/chat'
import { AppProvider } from '../AppContext'
import { ChatProvider, useChat } from '../ChatContext'

const server = setupServer(...chatHandlers)

beforeAll(() => server.listen())
afterEach(() => { server.resetHandlers(); localStorage.clear() })
afterAll(() => server.close())

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>
    <ChatProvider>{children}</ChatProvider>
  </AppProvider>
)

describe('ChatContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('초기 상태', () => {
    it('채널 목록이 존재한다', async () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      await waitFor(() => expect(result.current.channels.length).toBeGreaterThan(0))
    })

    it('초기 활성 채널 ID가 설정되어 있다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      expect(result.current.activeChannelId).toBeTruthy()
    })

    it('초기 메시지가 존재한다', async () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(0))
    })
  })

  describe('setActiveChannelId', () => {
    it('활성 채널을 변경할 수 있다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      act(() => {
        result.current.setActiveChannelId('2')
      })
      expect(result.current.activeChannelId).toBe('2')
    })
  })

  describe('addMessage', () => {
    it('텍스트 메시지를 추가할 수 있다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      const prevCount = result.current.messages.length
      act(() => {
        result.current.addMessage('1', '안녕하세요')
      })
      expect(result.current.messages.length).toBe(prevCount + 1)
    })

    it('추가한 메시지의 내용이 저장된다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      act(() => {
        result.current.addMessage('1', '테스트 메시지')
      })
      const added = result.current.messages.at(-1)
      expect(added?.content).toBe('테스트 메시지')
      expect(added?.channelId).toBe('1')
    })

    it('파일 메시지를 추가할 수 있다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      act(() => {
        result.current.addMessage('1', undefined, [
          { name: 'file.pdf', url: 'http://example.com/file.pdf', type: 'application/pdf' },
        ])
      })
      const added = result.current.messages.at(-1)
      expect(added?.type).toBe('file')
      expect(added?.files).toHaveLength(1)
    })

    it('추가한 메시지가 상태에 반영된다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      const before = result.current.messages.length
      act(() => {
        result.current.addMessage('1', '저장 테스트')
      })
      expect(result.current.messages.length).toBe(before + 1)
    })
  })

  describe('getMessagesByChannel', () => {
    it('특정 채널의 메시지만 반환한다', () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      act(() => {
        result.current.addMessage('channel-a', '채널A 메시지')
        result.current.addMessage('channel-b', '채널B 메시지')
      })
      const channelAMessages = result.current.getMessagesByChannel('channel-a')
      expect(channelAMessages.every((m) => m.channelId === 'channel-a')).toBe(true)
    })

    it('메시지가 시간순으로 정렬된다', async () => {
      const { result } = renderHook(() => useChat(), { wrapper })
      await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(0))
      const messages = result.current.getMessagesByChannel('1')
      for (let i = 1; i < messages.length; i++) {
        expect(messages[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          messages[i - 1].timestamp.getTime()
        )
      }
    })
  })

  describe('useChat 훅', () => {
    it('ChatProvider 외부에서 useChat 호출 시 에러를 던진다', () => {
      expect(() => renderHook(() => useChat())).toThrow(
        'useChat must be used within ChatProvider'
      )
    })
  })
})
