import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { ChatMessage, Channel } from '../../../entities/message/model/types'
import { getChannels, getMessages, sendMessage as apiSendMessage } from '../../../shared/api/chatApi'
import type { ApiMessage } from '../../../shared/api/chatApi'

export type { ChatMessage, Channel } from '../../../entities/message/model/types'

const MUTED_CHANNELS_STORAGE_KEY = 'chat-muted-channels'
const LAST_READ_STORAGE_KEY = 'chat-last-read'

function loadMutedChannels(): string[] {
  try {
    const raw = localStorage.getItem(MUTED_CHANNELS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function loadLastRead(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LAST_READ_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {}
  } catch {
    return {}
  }
}

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
  refreshChannels: () => Promise<void>
  isChannelMuted: (channelId: string) => boolean
  toggleChannelMute: (channelId: string) => void
  getUnreadCount: (channelId: string) => number
  getLastReadAt: (channelId: string) => number | undefined
  markChannelRead: (channelId: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeChannelId, setActiveChannelId] = useState('')
  const [mutedChannels, setMutedChannels] = useState<string[]>(() => loadMutedChannels())
  const [lastReadAt, setLastReadAt] = useState<Record<string, number>>(() => loadLastRead())

  const isDirectChannel = useCallback((channelId: string) => channelId.startsWith('dm-'), [])

  useEffect(() => {
    try {
      localStorage.setItem(MUTED_CHANNELS_STORAGE_KEY, JSON.stringify(mutedChannels))
    } catch {
      // 저장 실패는 무시 (시크릿 모드 등) — 알림 설정은 메모리 상태로만 유지된다
    }
  }, [mutedChannels])

  useEffect(() => {
    try {
      localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(lastReadAt))
    } catch {
      // 저장 실패는 무시 — 읽음 상태는 메모리 상태로만 유지된다
    }
  }, [lastReadAt])

  const isChannelMuted = useCallback(
    (channelId: string) => mutedChannels.includes(channelId),
    [mutedChannels]
  )

  const toggleChannelMute = useCallback((channelId: string) => {
    setMutedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    )
  }, [])

  const getLastReadAt = useCallback(
    (channelId: string) => lastReadAt[channelId],
    [lastReadAt]
  )

  const markChannelRead = useCallback((channelId: string) => {
    setLastReadAt((prev) => ({ ...prev, [channelId]: Date.now() }))
  }, [])

  useEffect(() => {
    if (!state.currentUser?.id) {
      setChannels([])
      setMessages([])
      setActiveChannelId('')
    }
  }, [state.currentUser?.id])

  const refreshChannels = useCallback(async () => {
    if (!state.currentUser?.id) {
      setChannels([])
      setMessages([])
      setActiveChannelId('')
      return
    }

    const data = await getChannels()
    setChannels(data)

    const nextActiveChannelId = data.find((channel) => channel.id === activeChannelId)?.id ?? data[0]?.id ?? ''
    setActiveChannelId(nextActiveChannelId)

    if (!nextActiveChannelId || isDirectChannel(nextActiveChannelId)) {
      return
    }

    const channelMessages = await getMessages(nextActiveChannelId)
    setMessages((prev) => [
      ...prev.filter((message) => message.channelId !== nextActiveChannelId),
      ...channelMessages.map(apiMsgToChatMsg),
    ])
  }, [activeChannelId, isDirectChannel, state.currentUser?.id])

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

  const getUnreadCount = useCallback(
    (channelId: string) => {
      const currentUserId = state.currentUser?.id ?? ''
      const incoming = messages.filter((m) => m.channelId === channelId && m.userId !== currentUserId)
      const readAt = lastReadAt[channelId]
      if (readAt === undefined) {
        // 한 번도 열어보지 않은 채널: 불러온 메시지가 있으면 그 개수,
        // 아직 메시지를 불러오지 않았다면 미리보기(lastMessage) 기준으로 1건 처리
        if (incoming.length > 0) return incoming.length
        return channels.find((c) => c.id === channelId)?.lastMessage ? 1 : 0
      }
      return incoming.filter((m) => m.timestamp.getTime() > readAt).length
    },
    [channels, lastReadAt, messages, state.currentUser?.id]
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
        refreshChannels,
        isChannelMuted,
        toggleChannelMute,
        getUnreadCount,
        getLastReadAt,
        markChannelRead,
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
