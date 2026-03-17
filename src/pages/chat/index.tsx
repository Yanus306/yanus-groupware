import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Search, Send, Paperclip, Smile, Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered, Code, X } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { useChat } from '../../features/chat/model'
import type { ChatMessage } from '../../features/chat/model'
import './chat.css'

const EMOJIS = ['😊', '👍', '❤️', '😂', '😢', '😍', '🔥', '✨', '🎉', '🙏', '👋', '💯', '✅', '❌', '⭐', '💪']

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
  const { state } = useApp()
  const { channels, activeChannelId, setActiveChannelId, addMessage, getMessagesByChannel } = useChat()
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; url: string; type: string }[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLButtonElement>(null)

  const activeChannel = channels.find((c) => c.id === activeChannelId)
  const messages = getMessagesByChannel(activeChannelId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const currentUserId = state.currentUser.id

  return (
    <div className="chat-page">
      <aside className="chat-sidebar glass">
        <h2>Messages</h2>
        <div className="search-wrap">
          <Search size={18} />
          <input placeholder="Search messages." />
        </div>
        <section>
          <h4>CHANNELS</h4>
          {channels.map((ch) => (
            <div
              key={ch.id}
              className={`channel-item ${ch.id === activeChannelId ? 'active' : ''}`}
              onClick={() => setActiveChannelId(ch.id)}
            >
              <span className="channel-name"># {ch.name}</span>
              <span className="channel-last">{ch.lastMessage}</span>
            </div>
          ))}
        </section>
        <section>
          <h4>DIRECT MESSAGES</h4>
          {state.users.map((u) => (
            <div key={u.id} className="dm-item">
              <span className="dm-avatar">{u.name[0]}</span>
              <span className="dm-name">{u.name}</span>
              <span className={`dm-status ${u.online ? 'online' : 'offline'}`}>
                • {u.online ? 'online' : 'away'}
              </span>
            </div>
          ))}
        </section>
      </aside>
      <div className="chat-main">
        <header className="chat-header glass">
          <div>
            <h3># {activeChannel?.name || 'Design Team'}</h3>
            <span className="members-count">23 members</span>
          </div>
          <div className="header-actions">
            <button><Search size={18} /></button>
            <button>⋮</button>
          </div>
        </header>
        <div className="chat-messages">
          {messages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} isOwn={msg.userId === currentUserId} />
          ))}
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
              <span className="msg-avatar">{state.currentUser.name[0]}</span>
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
              Send
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
