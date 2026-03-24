export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
}

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
