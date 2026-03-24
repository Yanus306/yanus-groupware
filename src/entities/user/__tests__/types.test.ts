import { describe, it, expectTypeOf } from 'vitest'
import type { UserRole, Team, User } from '../model/types'

describe('User 엔티티 타입', () => {
  it('UserRole은 백엔드 enum 값을 포함한다', () => {
    expectTypeOf<'MEMBER'>().toMatchTypeOf<UserRole>()
    expectTypeOf<'ADMIN'>().toMatchTypeOf<UserRole>()
    expectTypeOf<'TEAM_LEAD'>().toMatchTypeOf<UserRole>()
  })

  it('Team은 동적으로 생성되는 문자열 팀명을 포함한다', () => {
    expectTypeOf<'1팀'>().toMatchTypeOf<Team>()
    expectTypeOf<'2팀'>().toMatchTypeOf<Team>()
    expectTypeOf<string>().toMatchTypeOf<Team>()
  })

  it('User는 백엔드 MemberResponse 필드를 포함한다', () => {
    expectTypeOf<{
      id: string
      name: string
      email: string
      team: Team
      role: UserRole
    }>().toMatchTypeOf<User>()
  })
})
