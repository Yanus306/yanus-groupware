import { baseClient } from '../../../shared/api/baseClient'
import type { User } from '../../../entities/user/model/types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  team: User['team']
}

export async function login(email: string, password: string): Promise<string> {
  const data = await baseClient.post<{ accessToken: string }>('/auth/login', { email, password })
  return data.accessToken
}

export async function register(payload: RegisterPayload): Promise<string> {
  const data = await baseClient.post<{ accessToken: string }>('/auth/register', payload)
  return data.accessToken
}

export async function getMe(): Promise<User> {
  return baseClient.get<User>('/auth/me')
}
