export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
}

const SESSION_EXPIRED_KEY = 'yanus-session-expired-message'

export function getAccessToken() {
  return localStorage.getItem('accessToken')
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken')
}

export function storeAuthTokens(tokens: AuthTokens) {
  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)
}

export function clearAuthTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export function markSessionExpired(message = '세션이 만료되어 다시 로그인해 주세요') {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, message)
}

export function consumeSessionExpiredMessage() {
  const message = sessionStorage.getItem(SESSION_EXPIRED_KEY)
  if (message) {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY)
  }
  return message
}
