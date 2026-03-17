import { useState } from 'react'
import { Bot, MessageCircle, X, Send } from 'lucide-react'
import './StickyChatWidget.css'

export function StickyChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((m) => [...m, { role: 'user', text: input }])
    setInput('')
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: '파일 드라이브 기반 AI입니다. 공유된 파일 내용을 바탕으로 답변드립니다. (데모 모드)',
        },
      ])
    }, 500)
  }

  return (
    <div className="sticky-chat-widget">
      {open && (
        <div className="chat-popup">
          <div className="chat-header">
            <span className="popup-title">yANUs Assistant</span>
            <button className="close-btn" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="chat-body">
            {messages.length === 0 && (
              <div className="chat-greeting">
                Hello yANUs Assistant, or any queries read you ready!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input-wrap">
            <input
              type="text"
              placeholder="Ask about your files..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="sticky-buttons">
        <button className="sticky-toggle" onClick={() => setOpen((o) => !o)} title="AI Assistant">
          <Bot size={22} />
          <span>AI Assistant</span>
        </button>
        <button className="sticky-bubble" onClick={() => setOpen((o) => !o)}>
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  )
}
