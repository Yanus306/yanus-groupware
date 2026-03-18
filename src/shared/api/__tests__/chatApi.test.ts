import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { chatHandlers } from '../mock/handlers/chat'
import { getChannels, getMessages, sendMessage } from '../chatApi'

const server = setupServer(...chatHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('chatApi', () => {
  it('getChannels() 채널 목록을 반환한다', async () => {
    const channels = await getChannels()
    expect(channels).toHaveLength(3)
    expect(channels[0]).toMatchObject({ id: '1', name: 'General' })
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
})
