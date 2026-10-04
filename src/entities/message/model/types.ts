export interface ChatMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  content?: string
  type: 'text' | 'file'
  files?: { name: string; url: string; type: string }[]
  timestamp: Date
}

export type ChannelType = 'GENERAL' | 'TEAM' | 'DIRECT'

export interface Channel {
  id: string
  name: string
  type?: ChannelType
  memberCount?: number
  lastMessage?: string
}
