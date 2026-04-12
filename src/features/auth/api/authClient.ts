import { baseClient } from '../../../shared/api/baseClient'
import { ApiError } from '../../../shared/api/baseClient'
import type { User } from '../../../entities/user/model/types'
import { clearAuthTokens, storeAuthTokens } from '../../../shared/lib/authStorage'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  teamId: number
}

export interface LoginTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
}

// OpenAPI MeResponse: id는 integer(int64) — User.id(string)로 변환 필요
interface MeResponse {
  id: number
  name: string
  email: string
  team: string
  role: string
}

export async function login(email: string, password: string): Promise<string> {
  try {
    const data = await baseClient.post<LoginTokens>(
      '/api/v1/auth/login',
      { email, password },
    )
    storeAuthTokens(data)
    return data.accessToken
  } catch (err) {
    if (err instanceof ApiError && err.code === 'MEMBER_INACTIVE') {
      throw new Error('비활성화된 계정입니다. 관리자에게 문의해 주세요')
    }
    if (err instanceof ApiError && err.code === 'ACCOUNT_LOCKED') {
      throw new Error('로그인 5회 실패로 계정이 잠겼습니다. 30분 후 다시 시도해 주세요')
    }
    if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
      throw new Error('이메일 인증을 완료한 뒤 로그인해 주세요')
    }
    throw err
  }
}

export async function register(payload: RegisterPayload): Promise<void> {
  await baseClient.post<null>('/api/v1/auth/register', payload)
}

export async function getMe(): Promise<User> {
  const me = await baseClient.get<MeResponse>('/api/v1/auth/me')
  return {
    id: String(me.id),
    name: me.name,
    email: me.email,
    team: me.team as User['team'],
    role: me.role as User['role'],
  }
}

export async function logout(): Promise<void> {
  try {
    await baseClient.post<null>('/api/v1/auth/logout', {})
  } finally {
    clearAuthTokens()
  }
}

export async function verifyEmail(token: string): Promise<void> {
  await baseClient.post<Record<string, never>>('/api/v1/auth/verify-email', { token })
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await baseClient.post<Record<string, never>>('/api/v1/auth/verify-email/resend', { email })
}
