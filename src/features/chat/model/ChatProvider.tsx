import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { ChatMessage, Channel } from '../../../entities/message/model/types'
import { getChannels, getMessages, sendMessage as apiSendMessage } from '../../../shared/api/chatApi'
import type { ApiChannel, ApiMessage } from '../../../shared/api/chatApi'

export type { ChatMessage, Channel } from '../../../entities/message/model/types'

function apiMsgToChatMsg(m: ApiMessage): ChatMessage {
  return {
    id: m.id,
    channelId: m.channelId,
    userId: m.userId,
    userName: m.userName,
    content: m.content,
    type: m.type as 'text' | 'file',
    timestamp: new Date(m.timestamp),
  }
}

type ChatContextValue = {
  channels: Channel[]
  messages: ChatMessage[]
  activeChannelId: string
  setActiveChannelId: (id: string) => void
  addMessage: (channelId: string, content?: string, files?: { name: string; url: string; type: string }[]) => void
  getMessagesByChannel: (channelId: string) => ChatMessage[]
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeChannelId, setActiveChannelId] = useState('1')

  const isDirectChannel = useCallback((channelId: string) => channelId.startsWith('dm-'), [])

  useEffect(() => {
    getChannels()
      .then((data: ApiChannel[]) => {
        setChannels(data)
        if (data.length > 0) setActiveChannelId(data[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeChannelId || isDirectChannel(activeChannelId)) return
    getMessages(activeChannelId)
      .then((data: ApiMessage[]) => {
        setMessages((prev) => [
          ...prev.filter((m) => m.channelId !== activeChannelId),
          ...data.map(apiMsgToChatMsg),
        ])
      })
      .catch(() => {})
  }, [activeChannelId, isDirectChannel])

  const addMessage = useCallback(
    (channelId: string, content?: string, files?: { name: string; url: string; type: string }[]) => {
      const hasFiles = !!files?.length
      const hasContent = !!content?.trim()
      const type = hasFiles ? 'file' : 'text'
      const optimistic: ChatMessage = {
        id: `m${Date.now()}`,
        channelId,
        userId: state.currentUser?.id ?? '',
        userName: state.currentUser?.name ?? '알 수 없음',
        content: hasContent ? content!.trim() : undefined,
        type,
        files: hasFiles ? files : undefined,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, optimistic])
      if (isDirectChannel(channelId)) {
        return
      }
      apiSendMessage(channelId, content ?? '', type).catch(() => {})
    },
    [isDirectChannel, state.currentUser?.id, state.currentUser?.name]
  )

  const getMessagesByChannel = useCallback(
    (channelId: string) =>
      messages.filter((m) => m.channelId === channelId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    [messages]
  )

  return (
    <ChatContext.Provider
      value={{
        channels,
        messages,
        activeChannelId,
        setActiveChannelId,
        addMessage,
        getMessagesByChannel,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
