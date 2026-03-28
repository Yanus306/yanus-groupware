const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  markSessionExpired,
  storeAuthTokens,
} from '../lib/authStorage'

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
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorized(message = '세션이 만료되어 다시 로그인해 주세요') {
  clearAuthTokens()
  markSessionExpired(message)
  window.location.href = '/login'
}

function getRefreshFailureMessage(code = '') {
  switch (code) {
    case 'TOKEN_REUSED':
      return '보안을 위해 모든 세션이 종료되었습니다. 다시 로그인해 주세요'
    case 'REFRESH_TOKEN_NOT_FOUND':
      return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요'
    case 'EXPIRED_TOKEN':
      return '세션이 만료되어 다시 로그인해 주세요'
    default:
      return '세션이 만료되어 다시 로그인해 주세요'
  }
}

interface RefreshResult {
  ok: boolean
  message?: string
}

let refreshPromise: Promise<RefreshResult> | null = null

async function tryRefreshToken(): Promise<RefreshResult> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return { ok: false, message: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요' }
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!res.ok) {
          let code = ''
          try {
            const body = await res.json() as { code?: string }
            code = body.code ?? ''
          } catch {
            // Ignore non-JSON errors.
          }
          clearAuthTokens()
          return { ok: false, message: getRefreshFailureMessage(code) }
        }

        const body = await res.json() as unknown
        const data =
          body !== null &&
          typeof body === 'object' &&
          'data' in body &&
          'code' in body
            ? (body as { data: { accessToken: string; refreshToken: string; tokenType: string } }).data
            : body as { accessToken: string; refreshToken: string; tokenType: string }

        if (!data?.accessToken || !data?.refreshToken) {
          clearAuthTokens()
          return { ok: false, message: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요' }
        }

        storeAuthTokens(data)
        return { ok: true }
      } catch {
        clearAuthTokens()
        return { ok: false, message: '세션이 만료되어 다시 로그인해 주세요' }
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

async function request<T>(path: string, options: RequestInit = {}, canRetry = true): Promise<T> {
  const hasAuthToken = Boolean(getAccessToken())
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
    if (res.status === 401 && hasAuthToken && canRetry) {
      const refreshed = await tryRefreshToken()
      if (refreshed.ok) {
        return request<T>(path, options, false)
      }
      handleUnauthorized(refreshed.message)
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

async function requestBlob(path: string, canRetry = true): Promise<Blob> {
  const hasAuthToken = Boolean(getAccessToken())
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    if (hasAuthToken && canRetry) {
      const refreshed = await tryRefreshToken()
      if (refreshed.ok) {
        return requestBlob(path, false)
      }
      handleUnauthorized(refreshed.message)
    }
    throw new ApiError(401, '인증이 필요합니다', 'UNAUTHORIZED')
  }
  if (!res.ok) throw new ApiError(res.status, `다운로드 실패: ${res.status}`)
  return res.blob()
}

async function requestUpload<T>(path: string, formData: FormData, canRetry = true): Promise<T> {
  const hasAuthToken = Boolean(getAccessToken())
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(), // Content-Type 미설정 → 브라우저가 multipart boundary 자동 지정
    body: formData,
  })
  if (res.status === 401) {
    if (hasAuthToken && canRetry) {
      const refreshed = await tryRefreshToken()
      if (refreshed.ok) {
        return requestUpload<T>(path, formData, false)
      }
      handleUnauthorized(refreshed.message)
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
