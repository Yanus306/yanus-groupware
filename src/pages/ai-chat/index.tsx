import { useState, useRef, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'
import './ai-chat.css'

interface Message {
  role: 'user' | 'ai'
  text: string
}

const AI_API_URL = import.meta.env.VITE_AI_API_URL as string | undefined
const AI_API_MODEL = (import.meta.env.VITE_AI_API_MODEL as string | undefined) || 'llama3.1'

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: '안녕하세요! 저는 yANUs AI입니다. 파일 드라이브에 공유된 문서를 바탕으로 질문에 답변해 드립니다. 무엇을 도와드릴까요?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const callAI = async (userText: string) => {
    if (!AI_API_URL) {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: 'AI 서버 URL이 설정되지 않았습니다. `.env`에 VITE_AI_API_URL, VITE_AI_API_MODEL을 설정해 주세요.',
        },
      ])
      return
    }

    try {
      const body = {
        model: AI_API_MODEL,
        stream: false,
        messages: [
          ...messages.map((msg) => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.text,
          })),
          { role: 'user', content: userText },
        ],
      }

      const res = await fetch(`${AI_API_URL.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      const aiText =
        data?.message?.content ??
        data?.choices?.[0]?.message?.content ??
        'AI 응답을 불러오는 중 문제가 발생했습니다.'

      setMessages((m) => [...m, { role: 'ai', text: aiText }])
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: 'AI 서버와 통신할 수 없습니다. 서버 주소, 실행 상태, CORS 설정 등을 확인해 주세요.',
        },
      ])
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    if (loading) return

    const text = input
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    await callAI(text)
    setLoading(false)
  }

  const suggestions = ['오늘 일정 요약해줘', '공유된 파일 목록 알려줘', '프로젝트 진행 상황 정리해줘']

  return (
    <div className="ai-chat-page">
      <header className="ai-header">
        <div className="ai-title">
          <Bot size={24} />
          <h1>yANUs AI</h1>
        </div>
        <p className="ai-desc">파일 드라이브 기반 AI 어시스턴트</p>
      </header>

      <div className="ai-chat-area glass">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-bubble ${msg.role}`}>
              {msg.role === 'ai' && <Bot size={18} className="msg-icon" />}
              <span>{msg.text}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="suggestions">
            <p>추천 질문</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="input-area">
          <input
            placeholder="파일 관련 질문을 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          />
          <button className="send-btn" onClick={handleSend} disabled={loading}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
