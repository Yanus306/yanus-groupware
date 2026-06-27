import { baseClient } from './baseClient'

export type ApiChannelType = 'GENERAL' | 'TEAM' | 'DIRECT'

export interface ApiChannel {
  id: string
  name: string
  type?: ApiChannelType
  memberCount?: number
  lastMessage?: string
}

export interface ApiMessageFile {
  id: string
  name: string
  size: number
  contentType?: string
}

export interface ApiMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  content?: string
  type: string
  files?: ApiMessageFile[]
  timestamp: string
}

// --- 백엔드 원본 응답 (Long id, 대문자 type, senderId/createdAt) ---
interface RawChannel {
  id: number
  name: string
  type?: ApiChannelType
  memberCount?: number
  lastMessage?: string
}

interface RawMessageFile {
  id: number
  originalName: string
  size: number
  contentType?: string
}

interface RawMessage {
  id: number
  channelId: number
  senderId: number
  senderName: string
  content?: string
  type: 'TEXT' | 'FILE'
  files?: RawMessageFile[]
  createdAt: string
}

function mapChannel(c: RawChannel): ApiChannel {
  return {
    id: String(c.id),
    name: c.name,
    type: c.type,
    memberCount: c.memberCount,
    lastMessage: c.lastMessage,
  }
}

function mapMessage(m: RawMessage): ApiMessage {
  return {
    id: String(m.id),
    channelId: String(m.channelId),
    userId: String(m.senderId),
    userName: m.senderName,
    content: m.content,
    type: m.type.toLowerCase(),
    files: m.files?.map((f) => ({
      id: String(f.id),
      name: f.originalName,
      size: f.size,
      contentType: f.contentType,
    })),
    timestamp: m.createdAt,
  }
}

export const getChannels = async (): Promise<ApiChannel[]> =>
  (await baseClient.get<RawChannel[]>('/channels')).map(mapChannel)

export const getMessages = async (channelId: string, page = 0, size = 50): Promise<ApiMessage[]> =>
  (await baseClient.get<RawMessage[]>(`/channels/${channelId}/messages?page=${page}&size=${size}`)).map(mapMessage)

export const sendMessage = async (channelId: string, content: string, type: string): Promise<ApiMessage> =>
  mapMessage(await baseClient.post<RawMessage>(`/channels/${channelId}/messages`, {
    content,
    type: type.toUpperCase(),
  }))

export const sendFileMessage = async (
  channelId: string,
  content: string | undefined,
  files: File[],
): Promise<ApiMessage> => {
  const form = new FormData()
  if (content) form.append('content', content)
  files.forEach((file) => form.append('files', file))
  return mapMessage(await baseClient.upload<RawMessage>(`/channels/${channelId}/messages`, form))
}

// --- 채널 알림(음소거) 설정 ---
export const getMutedChannels = async (): Promise<string[]> =>
  (await baseClient.get<number[]>('/channels/notifications/muted')).map(String)

export const setChannelMuted = (channelId: string, muted: boolean): Promise<void> =>
  baseClient.put<void>(`/channels/${channelId}/notifications`, { muted })
