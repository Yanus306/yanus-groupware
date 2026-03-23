import { baseClient } from '../../../shared/api/baseClient'
import type { User } from '../../../entities/user/model/types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  teamId: number
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
  await baseClient.post<null>('/api/v1/auth/logout', {})
}
