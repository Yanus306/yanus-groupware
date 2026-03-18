import { baseClient } from '../../../shared/api/baseClient'
import type { User } from '../../../entities/user/model/types'

export async function login(email: string, password: string): Promise<string> {
  const data = await baseClient.post<{ accessToken: string }>('/auth/login', { email, password })
  return data.accessToken
}

export async function getMe(): Promise<User> {
  return baseClient.get<User>('/auth/me')
}
