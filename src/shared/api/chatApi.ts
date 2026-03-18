import { baseClient } from './baseClient'

export interface ApiChannel {
  id: string
  name: string
  lastMessage?: string
}

export interface ApiMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  content?: string
  type: string
  timestamp: string
}

export const getChannels = () => baseClient.get<ApiChannel[]>('/channels')

export const getMessages = (channelId: string) =>
  baseClient.get<ApiMessage[]>(`/channels/${channelId}/messages`)

export const sendMessage = (channelId: string, content: string, type: string) =>
  baseClient.post<ApiMessage>(`/channels/${channelId}/messages`, { content, type })
