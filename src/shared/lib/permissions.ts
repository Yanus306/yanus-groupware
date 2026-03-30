import type { User } from '../../entities/user/model/types'
import { DEFAULT_SIGNUP_TEAM_NAME } from './team'

type MaybeUser = Pick<User, 'id' | 'role' | 'team'> | null | undefined
type MaybeTargetUser = Pick<User, 'id' | 'role' | 'team' | 'status'> | null | undefined

export function canAccessAdmin(user: MaybeUser) {
  return user?.role === 'ADMIN'
}

export function canAccessTeamManagement(user: MaybeUser) {
  return user?.role === 'TEAM_LEAD'
}

export function canAccessDrive(user: MaybeUser) {
  if (!user) return true
  return user.team !== DEFAULT_SIGNUP_TEAM_NAME
}

export function canManageMemberRoles(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canManageMemberRolesFor(user: MaybeUser, target: MaybeTargetUser) {
  if (!canAccessAdmin(user) || !target) return false
  return user?.id !== target.id
}

export function canManageMemberStatus(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canManageMemberStatusFor(user: MaybeUser, target: MaybeTargetUser) {
  if (!canAccessAdmin(user) || !target) return false
  return user?.id !== target.id
}

export function canExpelMembers(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canExpelMembersFor(user: MaybeUser, target: MaybeTargetUser) {
  if (!canAccessAdmin(user) || !target) return false
  return user?.id !== target.id
}

export function canChangeMemberTeam(user: MaybeUser) {
  return canAccessAdmin(user) || canAccessTeamManagement(user)
}

export function canChangeMemberTeamFor(user: MaybeUser, target: MaybeTargetUser) {
  if (!user || !target || user.id === target.id) return false

  if (canAccessAdmin(user)) {
    return true
  }

  if (!canAccessTeamManagement(user)) {
    return false
  }

  return target.role === 'MEMBER'
    && target.team === user.team
    && (target.status ?? 'ACTIVE') === 'ACTIVE'
}

export function canManageTeams(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canViewManagedAttendance(user: MaybeUser) {
  return canAccessAdmin(user) || canAccessTeamManagement(user)
}

export function canViewAllWorkSchedules(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canViewTeamWorkSchedules(user: MaybeUser) {
  return canAccessAdmin(user) || canAccessTeamManagement(user)
}
