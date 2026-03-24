import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Search, Send, Paperclip, Smile, Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered, Code, X, ArrowLeft } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { useChat } from '../../features/chat/model'
import type { ChatMessage } from '../../features/chat/model'
import { getMembers } from '../../shared/api/membersApi'
import './chat.css'

const EMOJIS = ['😊', '👍', '❤️', '😂', '😢', '😍', '🔥', '✨', '🎉', '🙏', '👋', '💯', '✅', '❌', '⭐', '💪']
const CHANNEL_LABELS: Record<string, string> = {
  General: '전체 공지',
  'Design Team': '디자인팀',
  'Dev Team': '개발팀',
}
const TEAM_LABELS: Record<string, string> = {
  BACKEND: '백엔드',
  FRONTEND: '프론트엔드',
  AI: 'AI',
  SECURITY: '보안',
}

function formatTime(date: Date): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' +
    date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function MessageContent({ content }: { content: string }) {
  const trimmed = content.replace(/\n+$/, '').replace(/\s+$/, '')
  // 마크다운 문법으로 줄바꿈: "  \n" = hard break (remark-breaks 제거로 마지막 글자 따로 감 방지)
  const forMarkdown = trimmed.replace(/\n/g, '  \n')
  return (
    <div className="msg-markdown">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">{children}</a>
          ),
        }}
      >
        {forMarkdown}
      </ReactMarkdown>
    </div>
  )
}

function MessageItem({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  if (msg.type === 'file' && msg.files?.length) {
    return (
      <div className={`msg file-msg ${isOwn ? 'own' : ''}`}>
        <span className="msg-avatar">{msg.userName[0]}</span>
        <div className="msg-content">
          <div className="msg-meta">
            <strong>{msg.userName}</strong>
            <span className="msg-time">{formatTime(msg.timestamp)}</span>
          </div>
          {msg.content && <MessageContent content={msg.content} />}
          {msg.files.map((f, i) => (
            <div key={i} className="file-attachment">
              <span className="file-icon">
                {f.type.startsWith('image/') && f.url ? (
                  <img src={f.url} alt={f.name} className="file-preview-img" />
                ) : (
                  '📄'
                )}
              </span>
              <span>{f.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className={`msg ${isOwn ? 'own' : ''}`}>
      <span className="msg-avatar">{msg.userName[0]}</span>
      <div className="msg-content">
        <div className="msg-meta">
          <strong>{msg.userName}</strong>
          <span className="msg-time">{formatTime(msg.timestamp)}</span>
        </div>
        {msg.content && <MessageContent content={msg.content} />}
      </div>
    </div>
  )
}

export function Chat() {
  const { state, loadMembers } = useApp()
  const { channels, activeChannelId, setActiveChannelId, addMessage, getMessagesByChannel } = useChat()
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; url: string; type: string }[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [roomQuery, setRoomQuery] = useState('')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [isMobileRoomOpen, setIsMobileRoomOpen] = useState(() => window.innerWidth > 768)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLButtonElement>(null)

  const activeChannel = channels.find((c) => c.id === activeChannelId)
  const currentUserId = state.currentUser?.id ?? ''
  const directRooms = state.users.filter((user) => user.id !== currentUserId)
  const activeDirectUser = directRooms.find((user) => `dm-${user.id}` === activeChannelId)
  const isDirectRoom = activeChannelId.startsWith('dm-')
  const messages = getMessagesByChannel(activeChannelId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (state.users.length > 0) return
    getMembers()
      .then(loadMembers)
      .catch(() => {})
  }, [loadMembers, state.users.length])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setIsMobileRoomOpen((prev) => (mobile ? prev && !!activeChannelId : true))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeChannelId])

  useEffect(() => {
    if (!isMobile) {
      setIsMobileRoomOpen(true)
    }
  }, [isMobile])

  useEffect(() => {
    if (!showEmojiPicker) return
    const onOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current?.contains(e.target as Node)) return
      setShowEmojiPicker(false)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [showEmojiPicker])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed && !attachedFiles.length) return
    addMessage(activeChannelId, trimmed || undefined, attachedFiles.length ? attachedFiles : undefined)
    setMessage('')
    setAttachedFiles([])
  }

  const applyFormat = (before: string, after: string) => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const selected = message.slice(start, end)
    const wrapped = selected ? `${before}${selected}${after}` : `${before} ${after}`
    const newText = message.slice(0, start) + wrapped + message.slice(end)
    setMessage(newText)
    input.focus()
    setTimeout(() => {
      input.setSelectionRange(start + before.length, start + before.length + (selected || ' ').length)
    }, 0)
  }

  const handleBold = () => applyFormat('**', '**')
  const handleItalic = () => applyFormat('*', '*')
  const handleStrike = () => applyFormat('~~', '~~')
  const handleCode = () => applyFormat('`', '`')

  const handleList = () => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? 0
    const insert = '\n- '
    setMessage(message.slice(0, start) + insert + message.slice(start))
    input.focus()
    input.setSelectionRange(start + insert.length, start + insert.length)
  }

  const handleOrderedList = () => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? 0
    const insert = '\n1. '
    setMessage(message.slice(0, start) + insert + message.slice(start))
    input.focus()
    input.setSelectionRange(start + insert.length, start + insert.length)
  }

  const handleEmoji = (emoji: string) => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? message.length
    setMessage(message.slice(0, start) + emoji + message.slice(start))
    input.focus()
    setShowEmojiPicker(false)
  }

  const handleLink = () => {
    if (linkUrl.trim()) {
      const input = inputRef.current
      const start = input?.selectionStart ?? 0
      const end = input?.selectionEnd ?? 0
      const selected = message.slice(start, end) || '링크'
      const link = `[${selected}](${linkUrl.trim()})`
      setMessage(message.slice(0, start) + link + message.slice(end))
      input?.focus()
    }
    setShowLinkModal(false)
    setLinkUrl('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const newFiles: { name: string; url: string; type: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      newFiles.push({
        name: f.name,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
        type: f.type,
      })
    }
    setAttachedFiles((prev) => [...prev, ...newFiles])
    e.target.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachedFiles((prev) => {
      const f = prev[idx]
      if (f.url) URL.revokeObjectURL(f.url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(roomQuery.toLowerCase()) ||
    (channel.lastMessage ?? '').toLowerCase().includes(roomQuery.toLowerCase()),
  )

  const filteredDirectRooms = directRooms.filter((user) =>
    user.name.toLowerCase().includes(roomQuery.toLowerCase()) ||
    user.team.toLowerCase().includes(roomQuery.toLowerCase()),
  )

  const openRoom = (id: string) => {
    setActiveChannelId(id)
    if (isMobile) {
      setIsMobileRoomOpen(true)
    }
  }

  const roomTitle = isDirectRoom
    ? activeDirectUser?.name ?? '대화방'
    : `# ${CHANNEL_LABELS[activeChannel?.name ?? ''] ?? activeChannel?.name ?? '디자인팀'}`

  const roomMeta = isDirectRoom
    ? `${TEAM_LABELS[activeDirectUser?.team ?? ''] ?? activeDirectUser?.team ?? '알 수 없는 팀'} · ${activeDirectUser?.online ? '대화 가능' : '현재 자리 비움'}`
    : '23명 참여 중'

  return (
    <div className={`chat-page ${isMobileRoomOpen ? 'room-open-mobile' : 'list-open-mobile'}`}>
      <aside className="chat-sidebar glass">
        <div className="chat-list-head">
          <h2>대화 목록</h2>
          <p>대화할 채널이나 대상을 먼저 선택한 뒤 대화방으로 들어갑니다.</p>
        </div>
        <div className="search-wrap">
          <Search size={18} />
          <input
            placeholder="채널이나 대상을 검색하세요."
            value={roomQuery}
            onChange={(e) => setRoomQuery(e.target.value)}
          />
        </div>
        <section>
          <h4>채널</h4>
          {filteredChannels.map((ch) => (
            <div
              key={ch.id}
              className={`channel-item ${ch.id === activeChannelId ? 'active' : ''}`}
              onClick={() => openRoom(ch.id)}
            >
              <span className="channel-name"># {CHANNEL_LABELS[ch.name] ?? ch.name}</span>
              <span className="channel-last">{ch.lastMessage}</span>
            </div>
          ))}
        </section>
        <section>
          <h4>개인 대화</h4>
          {filteredDirectRooms.map((u) => (
            <div
              key={u.id}
              className={`dm-item ${activeChannelId === `dm-${u.id}` ? 'active' : ''}`}
              onClick={() => openRoom(`dm-${u.id}`)}
            >
              <span className="dm-avatar">{u.name[0]}</span>
              <div className="dm-copy">
                <span className="dm-name">{u.name}</span>
                <span className="dm-room-hint">{TEAM_LABELS[u.team] ?? u.team}</span>
              </div>
              <span className={`dm-status ${u.online ? 'online' : 'offline'}`}>
                • {u.online ? '온라인' : '자리 비움'}
              </span>
            </div>
          ))}
          {filteredChannels.length === 0 && filteredDirectRooms.length === 0 && (
            <div className="chat-empty-search">검색 결과가 없습니다.</div>
          )}
        </section>
      </aside>
      <div className="chat-main">
        <header className="chat-header glass">
          <div className="chat-room-meta">
            {isMobile && isMobileRoomOpen && (
              <button type="button" className="chat-back-btn" onClick={() => setIsMobileRoomOpen(false)}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h3>{roomTitle}</h3>
              <span className="members-count">{roomMeta}</span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button><Search size={18} /></button>
            <button>⋮</button>
          </div>
        </header>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-room">
              <strong>{isDirectRoom ? `${activeDirectUser?.name ?? '상대방'}에게 첫 메시지를 보내보세요.` : '아직 대화가 없습니다.'}</strong>
              <p>대상을 고른 뒤 바로 대화를 시작할 수 있도록 방 구조를 정리했습니다.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} isOwn={msg.userId === currentUserId} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-area glass">
          {attachedFiles.length > 0 && (
            <div className="attachments-preview">
              {attachedFiles.map((f, i) => (
                <span key={i} className="attach-tag">
                  {f.type.startsWith('image/') ? (
                    <img src={f.url} alt="" className="attach-thumb" />
                  ) : (
                    f.name
                  )}
                  <button type="button" onClick={() => removeAttachment(i)}><X size={14} /></button>
                </span>
              ))}
            </div>
          )}
          {message.trim() && (
            <div className="input-preview msg own">
              <span className="msg-avatar">{state.currentUser?.name[0] ?? '?'}</span>
              <div className="msg-content input-preview-content">
                <MessageContent content={message} />
              </div>
            </div>
          )}
          <div className="input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="메시지 입력... (Shift+Enter 줄바꿈)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
              rows={1}
            />
            <button className="send-btn" onClick={handleSend}>
              <Send size={18} />
              보내기
            </button>
          </div>
          <div className="format-toolbar">
            <button onClick={handleBold} title="Bold"><Bold size={16} /></button>
            <button onClick={handleItalic} title="Italic"><Italic size={16} /></button>
            <button onClick={handleStrike} title="Strikethrough"><Strikethrough size={16} /></button>
            <button onClick={() => setShowLinkModal(true)} title="Link"><LinkIcon size={16} /></button>
            <button onClick={handleList} title="Bullet list"><List size={16} /></button>
            <button onClick={handleOrderedList} title="Numbered list"><ListOrdered size={16} /></button>
            <button onClick={handleCode} title="Code"><Code size={16} /></button>
            <button ref={emojiPickerRef} onClick={() => setShowEmojiPicker((v) => !v)} title="Emoji">
              <Smile size={16} />
              {showEmojiPicker && (
                <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
                  {EMOJIS.map((emoji, i) => (
                    <button key={i} type="button" onClick={() => handleEmoji(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </button>
            <label className="attach-label" title="Attach file">
              <Paperclip size={16} />
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} hidden />
            </label>
          </div>
        </div>
      </div>

      {showLinkModal && (
        <div className="link-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="link-modal glass" onClick={(e) => e.stopPropagation()}>
            <h4>링크 삽입</h4>
            <input
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLink()}
            />
            <div className="link-modal-actions">
              <button onClick={() => setShowLinkModal(false)}>취소</button>
              <button className="primary" onClick={handleLink}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
