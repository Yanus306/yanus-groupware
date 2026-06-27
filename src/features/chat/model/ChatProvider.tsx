import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { ChatMessage, Channel } from '../../../entities/message/model/types'
import {
  getChannels,
  getMessages,
  sendMessage as apiSendMessage,
  sendFileMessage as apiSendFileMessage,
  getMutedChannels,
  setChannelMuted,
} from '../../../shared/api/chatApi'
import type { ApiMessage } from '../../../shared/api/chatApi'
import { getCookie, setCookie } from '../../../shared/lib/cookie'

export type { ChatMessage, Channel } from '../../../entities/message/model/types'

const LAST_READ_COOKIE_KEY = 'chat-last-read'
const LEFT_CHANNELS_COOKIE_KEY = 'chat-left-channels'

function loadStringList(cookieKey: string): string[] {
  try {
    const raw = getCookie(cookieKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function loadLastRead(): Record<string, number> {
  try {
    const raw = getCookie(LAST_READ_COOKIE_KEY)
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
    files: m.files?.map((f) => ({ name: f.name, url: '', type: f.contentType ?? '' })),
    timestamp: new Date(m.timestamp),
  }
}

type ChatContextValue = {
  channels: Channel[]
  messages: ChatMessage[]
  activeChannelId: string
  setActiveChannelId: (id: string) => void
  addMessage: (
    channelId: string,
    content?: string,
    files?: { name: string; url: string; type: string }[],
    rawFiles?: File[],
  ) => void
  getMessagesByChannel: (channelId: string) => ChatMessage[]
  refreshChannels: () => Promise<void>
  isChannelMuted: (channelId: string) => boolean
  toggleChannelMute: (channelId: string) => void
  getUnreadCount: (channelId: string) => number
  getLastReadAt: (channelId: string) => number | undefined
  markChannelRead: (channelId: string) => void
  visibleChannels: Channel[]
  isChannelLeft: (channelId: string) => boolean
  leaveChannel: (channelId: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeChannelId, setActiveChannelId] = useState('')
  const [mutedChannels, setMutedChannels] = useState<string[]>([])
  const [lastReadAt, setLastReadAt] = useState<Record<string, number>>(() => loadLastRead())
  const [leftChannels, setLeftChannels] = useState<string[]>(() => loadStringList(LEFT_CHANNELS_COOKIE_KEY))

  const isDirectChannel = useCallback((channelId: string) => channelId.startsWith('dm-'), [])

  useEffect(() => {
    try {
      setCookie(LAST_READ_COOKIE_KEY, JSON.stringify(lastReadAt))
    } catch {
      // 저장 실패는 무시 — 읽음 상태는 메모리 상태로만 유지된다
    }
  }, [lastReadAt])

  const isChannelMuted = useCallback(
    (channelId: string) => mutedChannels.includes(channelId),
    [mutedChannels]
  )

  // 알림(음소거) 설정은 서버에 영속화한다. 낙관적 업데이트 후 실패 시 롤백.
  const toggleChannelMute = useCallback((channelId: string) => {
    if (isDirectChannel(channelId)) return
    const nextMuted = !mutedChannels.includes(channelId)
    setMutedChannels((prev) =>
      nextMuted ? [...prev, channelId] : prev.filter((id) => id !== channelId)
    )
    setChannelMuted(channelId, nextMuted).catch(() => {
      setMutedChannels((prev) =>
        nextMuted ? prev.filter((id) => id !== channelId) : [...prev, channelId]
      )
    })
  }, [isDirectChannel, mutedChannels])

  const getLastReadAt = useCallback(
    (channelId: string) => lastReadAt[channelId],
    [lastReadAt]
  )

  const markChannelRead = useCallback((channelId: string) => {
    setLastReadAt((prev) => ({ ...prev, [channelId]: Date.now() }))
  }, [])

  useEffect(() => {
    try {
      setCookie(LEFT_CHANNELS_COOKIE_KEY, JSON.stringify(leftChannels))
    } catch {
      // 저장 실패는 무시 — 나간 채팅방 목록은 메모리 상태로만 유지된다
    }
  }, [leftChannels])

  const isChannelLeft = useCallback(
    (channelId: string) => leftChannels.includes(channelId),
    [leftChannels]
  )

  const leaveChannel = useCallback(
    (channelId: string) => {
      setLeftChannels((prev) => (prev.includes(channelId) ? prev : [...prev, channelId]))
      // 나간 방이 현재 보고 있던 방이면 남아있는 첫 번째 방으로 전환한다.
      setActiveChannelId((prev) => {
        if (prev !== channelId) return prev
        const next = channels.find((c) => c.id !== channelId && !leftChannels.includes(c.id))
        return next?.id ?? ''
      })
    },
    [channels, leftChannels]
  )

  const visibleChannels = channels.filter((c) => !leftChannels.includes(c.id))

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

    // 서버에 저장된 채널 알림(음소거) 설정을 불러온다.
    getMutedChannels().then(setMutedChannels).catch(() => {})

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
    (
      channelId: string,
      content?: string,
      files?: { name: string; url: string; type: string }[],
      rawFiles?: File[],
    ) => {
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
      if (hasFiles && rawFiles?.length) {
        apiSendFileMessage(channelId, hasContent ? content!.trim() : undefined, rawFiles).catch(() => {})
      } else {
        apiSendMessage(channelId, content ?? '', type).catch(() => {})
      }
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
        visibleChannels,
        isChannelLeft,
        leaveChannel,
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
