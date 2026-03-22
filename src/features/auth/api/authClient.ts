import { baseClient } from '../../../shared/api/baseClient'
import type { User } from '../../../entities/user/model/types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  teamId: number
}

export async function login(email: string, password: string): Promise<string> {
  const data = await baseClient.post<{ accessToken: string; refreshToken: string; tokenType: string }>(
    '/api/v1/auth/login',
    { email, password },
  )
  return data.accessToken
}

export async function register(payload: RegisterPayload): Promise<void> {
  await baseClient.post<null>('/api/v1/auth/register', payload)
}

export async function getMe(): Promise<User> {
  return baseClient.get<User>('/api/v1/auth/me')
}

export async function logout(): Promise<void> {
  await baseClient.post<null>('/api/v1/auth/logout', {})
}
