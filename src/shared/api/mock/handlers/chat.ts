import { http, HttpResponse } from 'msw'

// 백엔드 응답 형태(Long id, 대문자 type, senderId/createdAt)에 맞춘 mock
const mockChannels = [
  { id: 1, name: 'General', type: 'GENERAL', memberCount: 23, lastMessage: '안녕하세요!' },
  { id: 2, name: 'Design Team', type: 'TEAM', memberCount: 6, lastMessage: '디자인 피드백 부탁드려요' },
  { id: 3, name: 'Dev Team', type: 'TEAM', memberCount: 8, lastMessage: 'PR 리뷰 요청드립니다' },
  { id: 4, name: 'Marketing Team', type: 'TEAM', memberCount: 5, lastMessage: '캠페인 일정 공유합니다' },
  { id: 5, name: 'Product Team', type: 'TEAM', memberCount: 4, lastMessage: '로드맵 업데이트했어요' },
]

type MockMessage = {
  id: number
  channelId: number
  senderId: number
  senderName: string
  content?: string
  type: 'TEXT' | 'FILE'
  files: { id: number; originalName: string; size: number; contentType?: string }[]
  createdAt: string
}

const mockMessages: Record<string, MockMessage[]> = {
  '1': [
    { id: 1, channelId: 1, senderId: 1, senderName: '김리더', content: '모두 좋은 아침입니다!', type: 'TEXT', files: [], createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, channelId: 1, senderId: 2, senderName: '박팀장', content: '좋은 아침이에요 :)', type: 'TEXT', files: [], createdAt: new Date(Date.now() - 3000000).toISOString() },
  ],
  '2': [
    { id: 3, channelId: 2, senderId: 2, senderName: '박팀장', content: '새 디자인 시안 공유드립니다', type: 'TEXT', files: [], createdAt: new Date(Date.now() - 7200000).toISOString() },
  ],
  '3': [
    { id: 4, channelId: 3, senderId: 1, senderName: '김리더', content: 'MSW 핸들러 PR 올렸습니다', type: 'TEXT', files: [], createdAt: new Date(Date.now() - 1800000).toISOString() },
  ],
}

let mutedChannelIds: number[] = []

export const chatHandlers = [
  http.get('/channels', () => {
    return HttpResponse.json(mockChannels)
  }),

  http.get('/channels/:id/messages', ({ params }) => {
    const messages = mockMessages[params.id as string] ?? []
    return HttpResponse.json(messages)
  }),

  http.post('/channels/:id/messages', async ({ params, request }) => {
    const channelId = Number(params.id)
    const contentType = request.headers.get('content-type') ?? ''
    let content: string | undefined
    let files: MockMessage['files'] = []
    let type: MockMessage['type'] = 'TEXT'

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      content = (form.get('content') as string) || undefined
      const uploaded = form.getAll('files') as File[]
      files = uploaded.map((f, i) => ({ id: i + 1, originalName: f.name, size: f.size, contentType: f.type }))
      type = 'FILE'
    } else {
      const body = await request.json() as { content?: string; type?: string }
      content = body.content
      type = body.type === 'FILE' ? 'FILE' : 'TEXT'
    }

    const newMsg: MockMessage = {
      id: Date.now(),
      channelId,
      senderId: 1,
      senderName: '나',
      content,
      type,
      files,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(newMsg, { status: 201 })
  }),

  http.get('/channels/notifications/muted', () => {
    return HttpResponse.json(mutedChannelIds)
  }),

  http.put('/channels/:id/notifications', async ({ params, request }) => {
    const channelId = Number(params.id)
    const body = await request.json() as { muted: boolean }
    if (body.muted) {
      if (!mutedChannelIds.includes(channelId)) mutedChannelIds.push(channelId)
    } else {
      mutedChannelIds = mutedChannelIds.filter((id) => id !== channelId)
    }
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: null })
  }),
]
