import { baseClient } from './baseClient'
import type { User } from '../../entities/user/model/types'

export const getMembers = () => baseClient.get<User[]>('/members')
