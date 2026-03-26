import { describe, expect, it } from 'vitest'
import {
  canAccessAdmin,
  canAccessTeamManagement,
  canManageMemberRoles,
  canManageMemberStatus,
  canExpelMembers,
  canChangeMemberTeam,
  canManageTeams,
  canViewManagedAttendance,
} from '../permissions'

const admin = { role: 'ADMIN' as const }
const teamLead = { role: 'TEAM_LEAD' as const }
const member = { role: 'MEMBER' as const }

describe('permissions', () => {
  it('관리자 권한을 정확히 판별한다', () => {
    expect(canAccessAdmin(admin)).toBe(true)
    expect(canAccessAdmin(teamLead)).toBe(false)
    expect(canAccessAdmin(member)).toBe(false)
  })

  it('팀장 전용 화면 접근을 정확히 판별한다', () => {
    expect(canAccessTeamManagement(teamLead)).toBe(true)
    expect(canAccessTeamManagement(admin)).toBe(false)
    expect(canAccessTeamManagement(member)).toBe(false)
  })

  it('멤버 역할, 상태, 퇴출 관리는 관리자만 가능하다', () => {
    expect(canManageMemberRoles(admin)).toBe(true)
    expect(canManageMemberStatus(admin)).toBe(true)
    expect(canExpelMembers(admin)).toBe(true)

    expect(canManageMemberRoles(teamLead)).toBe(false)
    expect(canManageMemberStatus(teamLead)).toBe(false)
    expect(canExpelMembers(teamLead)).toBe(false)
  })

  it('팀 변경은 관리자와 팀장만 가능하다', () => {
    expect(canChangeMemberTeam(admin)).toBe(true)
    expect(canChangeMemberTeam(teamLead)).toBe(true)
    expect(canChangeMemberTeam(member)).toBe(false)
  })

  it('팀 관리와 관리형 출퇴근 조회 권한을 정확히 판별한다', () => {
    expect(canManageTeams(admin)).toBe(true)
    expect(canManageTeams(teamLead)).toBe(false)
    expect(canViewManagedAttendance(admin)).toBe(true)
    expect(canViewManagedAttendance(teamLead)).toBe(true)
    expect(canViewManagedAttendance(member)).toBe(false)
  })
})
