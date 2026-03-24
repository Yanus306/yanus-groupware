const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, message: string, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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
  const hasAuthToken = Boolean(localStorage.getItem('accessToken'))
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message = `요청 실패: ${res.status}`
    let code = ''
    try {
      const data = await res.json() as { message?: string; code?: string }
      if (data.message) message = data.message
      if (data.code) code = data.code
    } catch {
      // Ignore non-JSON error bodies and keep the fallback message.
    }
    if (res.status === 401 && hasAuthToken) {
      handleUnauthorized()
    }
    throw new ApiError(res.status, message, code)
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

async function requestBlob(path: string): Promise<Blob> {
  const hasAuthToken = Boolean(localStorage.getItem('accessToken'))
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    if (hasAuthToken) {
      handleUnauthorized()
    }
    throw new ApiError(401, '인증이 필요합니다', 'UNAUTHORIZED')
  }
  if (!res.ok) throw new ApiError(res.status, `다운로드 실패: ${res.status}`)
  return res.blob()
}

async function requestUpload<T>(path: string, formData: FormData): Promise<T> {
  const hasAuthToken = Boolean(localStorage.getItem('accessToken'))
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(), // Content-Type 미설정 → 브라우저가 multipart boundary 자동 지정
    body: formData,
  })
  if (res.status === 401) {
    if (hasAuthToken) {
      handleUnauthorized()
    }
    throw new ApiError(401, '인증이 필요합니다', 'UNAUTHORIZED')
  }
  if (!res.ok) {
    let message = `업로드 실패: ${res.status}`
    let code = ''
    try {
      const data = await res.json() as { message?: string; code?: string }
      if (data.message) message = data.message
      if (data.code) code = data.code
    } catch { /* noop */ }
    throw new ApiError(res.status, message, code)
  }
  const body = await res.json() as unknown
  if (body !== null && typeof body === 'object' && 'data' in body && 'code' in body) {
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
  upload: <T>(path: string, formData: FormData) => requestUpload<T>(path, formData),
  download: (path: string) => requestBlob(path),
}
