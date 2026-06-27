import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { chatHandlers } from '../mock/handlers/chat'
import { getChannels, getMessages, sendMessage, parseSseMessage } from '../chatApi'

const server = setupServer(...chatHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('chatApi', () => {
  it('getChannels() 채널 목록을 반환한다', async () => {
    const channels = await getChannels()
    expect(channels).toHaveLength(5)
    expect(channels[0]).toMatchObject({ id: '1', name: 'General', type: 'GENERAL' })
  })

  it('getMessages() 채널 메시지 목록을 반환한다', async () => {
    const messages = await getMessages('1')
    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0]).toHaveProperty('channelId', '1')
  })

  it('sendMessage() 메시지를 전송하고 201 응답을 반환한다', async () => {
    const msg = await sendMessage('1', '테스트 메시지', 'text')
    expect(msg).toHaveProperty('id')
    expect(msg.content).toBe('테스트 메시지')
    expect(msg.channelId).toBe('1')
  })

  it('parseSseMessage() SSE 페이로드(백엔드 원본)를 ApiMessage로 변환한다', () => {
    const raw = JSON.stringify({
      id: 10,
      channelId: 2,
      senderId: 3,
      senderName: '박팀장',
      content: '실시간 메시지',
      type: 'TEXT',
      files: [],
      createdAt: '2026-03-26T09:00:00.000Z',
    })
    const msg = parseSseMessage(raw)
    expect(msg).toMatchObject({
      id: '10',
      channelId: '2',
      userId: '3',
      userName: '박팀장',
      content: '실시간 메시지',
      type: 'text',
    })
  })
})
