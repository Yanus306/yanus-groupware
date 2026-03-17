import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../../auth/model/AppProvider'
import type { ChatMessage, Channel } from '../../../entities/message/model/types'

export type { ChatMessage, Channel } from '../../../entities/message/model/types'

const STORAGE_KEY = 'yanus-chat-messages'

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.map((m: ChatMessage) => {
        const msg = { ...m, timestamp: new Date(m.timestamp) }
        if (msg.files) {
          msg.files = msg.files.map((f) => ({
            ...f,
            url: f.url?.startsWith('blob:') ? '' : f.url,
          }))
        }
        return msg
      })
    }
  } catch {}
  return []
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {}
}

const channels: Channel[] = [
  { id: '1', name: 'General', lastMessage: 'Last message of General...' },
  { id: '2', name: 'Design Team', lastMessage: 'Hey recommen best desig...' },
]

const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    channelId: '2',
    userId: '1',
    userName: 'Alex Johnson',
    content: 'Hey. Here are the next mockups for the dashboard. Please provide your design feedback.',
    type: 'text',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'm2',
    channelId: '2',
    userId: '1',
    userName: 'Alex Johnson',
    type: 'file',
    files: [{ name: 'Project_Brief_v3.pdf', url: '', type: 'application/pdf' }],
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: 'm3',
    channelId: '2',
    userId: '1',
    userName: 'Alex Johnson',
    content: 'func class Example() { name: "example.com"; return "code"; }',
    type: 'text',
    timestamp: new Date(Date.now() - 3400000),
  },
  {
    id: 'm4',
    channelId: '2',
    userId: '4',
    userName: 'Sarah Lee',
    content: 'Here are the latest mockups for the dashboard. Let me know what you think!',
    type: 'text',
    timestamp: new Date(Date.now() - 3300000),
  },
]

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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = loadMessages()
    return stored.length > 0 ? stored : initialMessages
  })
  const [activeChannelId, setActiveChannelId] = useState('2')

  const addMessage = useCallback(
    (channelId: string, content?: string, files?: { name: string; url: string; type: string }[]) => {
      const hasFiles = !!files?.length
      const hasContent = !!content?.trim()
      const msg: ChatMessage = {
        id: `m${Date.now()}`,
        channelId,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        content: hasContent ? content!.trim() : undefined,
        type: hasFiles ? 'file' : 'text',
        files: hasFiles ? files : undefined,
        timestamp: new Date(),
      }
      setMessages((prev) => {
        const next = [...prev, msg]
        saveMessages(next)
        return next
      })
    },
    [state.currentUser.id, state.currentUser.name]
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
