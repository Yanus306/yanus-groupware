import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendChatMessage } from '../aiClient'

const mockHistory = [
  { role: 'ai' as const, text: '안녕하세요!' },
  { role: 'user' as const, text: '파일 목록 보여줘' },
]

describe('aiClient.sendChatMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('API URL이 없으면 설정 안내 메시지를 반환한다', async () => {
    const result = await sendChatMessage(mockHistory, '테스트', undefined, 'llama3.1')
    expect(result).toContain('VITE_AI_API_URL')
  })

  it('성공 응답에서 message.content를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: { content: 'AI 응답입니다' } }),
      }),
    )
    const result = await sendChatMessage(mockHistory, '질문', 'http://localhost:11434', 'llama3.1')
    expect(result).toBe('AI 응답입니다')
  })

  it('choices 형식 응답도 처리한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OpenAI 형식 응답' } }] }),
      }),
    )
    const result = await sendChatMessage(mockHistory, '질문', 'http://localhost:11434', 'llama3.1')
    expect(result).toBe('OpenAI 형식 응답')
  })

  it('HTTP 에러 시 연결 실패 메시지를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )
    const result = await sendChatMessage(mockHistory, '질문', 'http://localhost:11434', 'llama3.1')
    expect(result).toContain('통신할 수 없습니다')
  })

  it('네트워크 에러 시 연결 실패 메시지를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await sendChatMessage(mockHistory, '질문', 'http://localhost:11434', 'llama3.1')
    expect(result).toContain('통신할 수 없습니다')
  })

  it('올바른 URL로 fetch를 호출한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '응답' } }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await sendChatMessage(mockHistory, '질문', 'http://localhost:11434/', 'llama3.1')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
