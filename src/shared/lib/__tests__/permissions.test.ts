import { describe, expect, it } from 'vitest'
import {
  canAccessAdmin,
  canAccessTeamManagement,
  canManageMemberRoles,
  canManageMemberRolesFor,
  canManageMemberStatus,
  canManageMemberStatusFor,
  canExpelMembers,
  canExpelMembersFor,
  canChangeMemberTeam,
  canChangeMemberTeamFor,
  canManageTeams,
  canViewManagedAttendance,
} from '../permissions'

const admin = { id: '1', role: 'ADMIN' as const, team: '1팀' }
const teamLead = { id: '2', role: 'TEAM_LEAD' as const, team: '1팀' }
const member = { id: '3', role: 'MEMBER' as const, team: '1팀' }
const otherMember = { id: '4', role: 'MEMBER' as const, team: '1팀', status: 'ACTIVE' as const }
const inactiveMember = { id: '5', role: 'MEMBER' as const, team: '1팀', status: 'INACTIVE' as const }
const otherLead = { id: '6', role: 'TEAM_LEAD' as const, team: '1팀', status: 'ACTIVE' as const }

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

  it('관리자는 본인 계정의 역할, 상태, 퇴출 액션을 수행할 수 없다', () => {
    expect(canManageMemberRolesFor(admin, admin)).toBe(false)
    expect(canManageMemberStatusFor(admin, admin)).toBe(false)
    expect(canExpelMembersFor(admin, admin)).toBe(false)
    expect(canManageMemberRolesFor(admin, otherMember)).toBe(true)
    expect(canManageMemberStatusFor(admin, otherMember)).toBe(true)
    expect(canExpelMembersFor(admin, otherMember)).toBe(true)
  })

  it('팀 변경은 관리자와 팀장만 가능하다', () => {
    expect(canChangeMemberTeam(admin)).toBe(true)
    expect(canChangeMemberTeam(teamLead)).toBe(true)
    expect(canChangeMemberTeam(member)).toBe(false)
  })

  it('팀장은 같은 팀의 활성 일반 멤버만 팀 변경할 수 있다', () => {
    expect(canChangeMemberTeamFor(teamLead, otherMember)).toBe(true)
    expect(canChangeMemberTeamFor(teamLead, inactiveMember)).toBe(false)
    expect(canChangeMemberTeamFor(teamLead, otherLead)).toBe(false)
    expect(canChangeMemberTeamFor(teamLead, admin)).toBe(false)
    expect(canChangeMemberTeamFor(teamLead, { ...otherMember, team: '2팀' })).toBe(false)
    expect(canChangeMemberTeamFor(teamLead, teamLead)).toBe(false)
  })

  it('관리자는 본인 외 멤버의 팀을 변경할 수 있다', () => {
    expect(canChangeMemberTeamFor(admin, otherMember)).toBe(true)
    expect(canChangeMemberTeamFor(admin, admin)).toBe(false)
  })

  it('팀 관리와 관리형 출퇴근 조회 권한을 정확히 판별한다', () => {
    expect(canManageTeams(admin)).toBe(true)
    expect(canManageTeams(teamLead)).toBe(false)
    expect(canViewManagedAttendance(admin)).toBe(true)
    expect(canViewManagedAttendance(teamLead)).toBe(true)
    expect(canViewManagedAttendance(member)).toBe(false)
  })
})
