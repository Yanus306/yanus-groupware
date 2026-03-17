interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

export async function sendChatMessage(
  history: ChatMessage[],
  userText: string,
  apiUrl: string | undefined,
  model: string,
): Promise<string> {
  if (!apiUrl) {
    return 'AI 서버 URL이 설정되지 않았습니다. `.env`에 VITE_AI_API_URL, VITE_AI_API_MODEL을 설정해 주세요.'
  }

  try {
    const body = {
      model,
      stream: false,
      messages: [
        ...history.map((msg) => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text,
        })),
        { role: 'user', content: userText },
      ],
    }

    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    return (
      data?.message?.content ??
      data?.choices?.[0]?.message?.content ??
      'AI 응답을 불러오는 중 문제가 발생했습니다.'
    )
  } catch {
    return 'AI 서버와 통신할 수 없습니다. 서버 주소, 실행 상태, CORS 설정 등을 확인해 주세요.'
  }
}
