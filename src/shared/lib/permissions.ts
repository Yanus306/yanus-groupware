import type { User } from '../../entities/user/model/types'

type MaybeUser = Pick<User, 'role'> | null | undefined

export function canAccessAdmin(user: MaybeUser) {
  return user?.role === 'ADMIN'
}

export function canAccessTeamManagement(user: MaybeUser) {
  return user?.role === 'TEAM_LEAD'
}

export function canManageMemberRoles(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canManageMemberStatus(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canExpelMembers(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canChangeMemberTeam(user: MaybeUser) {
  return canAccessAdmin(user) || canAccessTeamManagement(user)
}

export function canManageTeams(user: MaybeUser) {
  return canAccessAdmin(user)
}

export function canViewManagedAttendance(user: MaybeUser) {
  return canAccessAdmin(user) || canAccessTeamManagement(user)
}
