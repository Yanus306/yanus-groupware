import { http, HttpResponse } from 'msw'

const mockChannels = [
  { id: '1', name: 'General', lastMessage: '안녕하세요!' },
  { id: '2', name: 'Design Team', lastMessage: '디자인 피드백 부탁드려요' },
  { id: '3', name: 'Dev Team', lastMessage: 'PR 리뷰 요청드립니다' },
]

const mockMessages: Record<string, { id: string; channelId: string; userId: string; userName: string; content: string; type: string; timestamp: string }[]> = {
  '1': [
    { id: 'm1', channelId: '1', userId: '1', userName: '김리더', content: '모두 좋은 아침입니다!', type: 'text', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'm2', channelId: '1', userId: '2', userName: '박팀장', content: '좋은 아침이에요 :)', type: 'text', timestamp: new Date(Date.now() - 3000000).toISOString() },
  ],
  '2': [
    { id: 'm3', channelId: '2', userId: '2', userName: '박팀장', content: '새 디자인 시안 공유드립니다', type: 'text', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ],
  '3': [
    { id: 'm4', channelId: '3', userId: '1', userName: '김리더', content: 'MSW 핸들러 PR 올렸습니다', type: 'text', timestamp: new Date(Date.now() - 1800000).toISOString() },
  ],
}

export const chatHandlers = [
  http.get('/channels', () => {
    return HttpResponse.json(mockChannels)
  }),

  http.get('/channels/:id/messages', ({ params }) => {
    const messages = mockMessages[params.id as string] ?? []
    return HttpResponse.json(messages)
  }),

  http.post('/channels/:id/messages', async ({ params, request }) => {
    const body = await request.json() as { content: string; type: string }
    const newMsg = {
      id: `m${Date.now()}`,
      channelId: params.id as string,
      userId: '1',
      userName: '나',
      content: body.content,
      type: body.type,
      timestamp: new Date().toISOString(),
    }
    return HttpResponse.json(newMsg, { status: 201 })
  }),
]
