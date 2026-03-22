const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorized() {
  localStorage.removeItem('accessToken')
  window.location.href = '/login'
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    handleUnauthorized()
    throw new ApiError(401, '인증이 만료되었습니다')
  }

  if (!res.ok) {
    let message = `요청 실패: ${res.status}`
    try {
      const data = await res.json() as { message?: string }
      if (data.message) {
        message = data.message
      }
    } catch {
      // Ignore non-JSON error bodies and keep the fallback message.
    }
    throw new ApiError(res.status, message)
  }

  const body = await res.json() as unknown
  // 백엔드 표준 응답 래퍼 { code, message, data } 자동 unwrap
  if (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    'code' in body
  ) {
    return (body as { data: T }).data
  }
  return body as T
}

export const baseClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
