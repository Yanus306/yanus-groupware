import { ArrowLeftRight, Crown } from 'lucide-react'
import type { User } from '../../../entities/user/model/types'
import { formatTeamName } from '../../lib/team'
import { ActionMenu } from '../ActionMenu'
import './MemberManagementTable.css'

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  TEAM_LEAD: '팀장',
  MEMBER: '멤버',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
}

const statusToggleLabels: Record<string, string> = {
  ACTIVE: '활성화',
  INACTIVE: '비활성화',
}

interface MemberManagementTableProps {
  members: User[]
  saving?: boolean
  emptyMessage?: string
  showStatus?: boolean
  showActions?: boolean
  onResetPassword?: (member: User) => void
  onOpenRoleChange?: (member: User) => void
  onOpenTeamChange?: (member: User) => void
  onDeactivate?: (memberId: string) => void
  onActivate?: (memberId: string) => void
  onExpel?: (memberId: string) => void
  canManageRoleFor?: (member: User) => boolean
  canChangeTeamFor?: (member: User) => boolean
  canManageStatusFor?: (member: User) => boolean
  canExpelFor?: (member: User) => boolean
}

export function MemberManagementTable({
  members,
  saving = false,
  emptyMessage = '표시할 멤버가 없습니다.',
  showStatus = false,
  showActions = false,
  onResetPassword,
  onOpenRoleChange,
  onOpenTeamChange,
  onDeactivate,
  onActivate,
  onExpel,
  canManageRoleFor,
  canChangeTeamFor,
  canManageStatusFor,
  canExpelFor,
}: MemberManagementTableProps) {
  const showRoleChange = typeof onOpenRoleChange === 'function'
  const showResetPassword = typeof onResetPassword === 'function'
  const showTeamChange = typeof onOpenTeamChange === 'function'
  const showStatusAction = typeof onDeactivate === 'function' || typeof onActivate === 'function'
  const showExpel = typeof onExpel === 'function'

  return (
    <div className="member-management-table-wrap">
      <table className="member-management-table">
        <colgroup>
          <col className="member-profile-col" />
          <col className="member-team-col" />
          <col className="member-role-col" />
          {showStatus && <col className="member-status-col" />}
          {showActions && <col className="member-actions-col" />}
        </colgroup>
        <thead>
          <tr>
            <th>프로필</th>
            <th>팀</th>
            <th>역할</th>
            {showStatus && <th className="member-table-heading-center">상태</th>}
            {showActions && <th className="member-table-heading-center">관리</th>}
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td
                colSpan={3 + (showStatus ? 1 : 0) + (showActions ? 1 : 0)}
                className="member-management-empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            members.map((member) => {
              const status = member.status ?? 'ACTIVE'
              const isInactive = status === 'INACTIVE'
              const canManageRole = showRoleChange && (canManageRoleFor ? canManageRoleFor(member) : true)
              const canChangeTeam = showTeamChange && (canChangeTeamFor ? canChangeTeamFor(member) : true)
              const canManageStatus = showStatusAction && (canManageStatusFor ? canManageStatusFor(member) : true)
              const canExpel = showExpel && (canExpelFor ? canExpelFor(member) : true)
              const menuItems = [
                ...(canManageRole
                  ? [{
                      label: '역할 변경',
                      onSelect: () => onOpenRoleChange?.(member),
                    }]
                  : []),
                ...(canManageRole && showResetPassword
                  ? [{
                      label: '임시 비밀번호 발급',
                      tone: 'warning' as const,
                      disabled: saving,
                      onSelect: () => onResetPassword?.(member),
                    }]
                  : []),
                ...(canExpel
                  ? [{
                      label: isInactive ? '퇴출됨' : '퇴출',
                      tone: 'danger' as const,
                      disabled: saving || isInactive,
                      onSelect: () => onExpel?.(member.id),
                    }]
                  : []),
              ]
              const hasActionControls = canChangeTeam || menuItems.length > 0

              return (
                <tr key={member.id}>
                  <td>
                    <div className="member-profile-cell">
                      <span className="member-avatar">{member.name[0]}</span>
                      <span className="member-profile-name">{member.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="member-team-tag">{formatTeamName(member.team)}</span>
                  </td>
                  <td>
                    <span className={`member-role-tag ${member.role}`}>
                      {member.role === 'ADMIN' && <Crown size={14} />}
                      {roleLabels[member.role] ?? member.role}
                    </span>
                  </td>
                  {showStatus && (
                    <td className="member-table-status-cell">
                      <div className="member-status-stack">
                        {canManageStatus ? (
                          <button
                            type="button"
                            className={`member-status-toggle ${status}`}
                            aria-pressed={!isInactive}
                            disabled={saving || (isInactive ? !onActivate : !onDeactivate)}
                            onClick={() => {
                              if (isInactive) {
                                onActivate?.(member.id)
                                return
                              }
                              onDeactivate?.(member.id)
                            }}
                          >
                            {statusToggleLabels[status] ?? status}
                          </button>
                        ) : (
                          <span className={`member-status-tag ${status}`}>
                            {statusLabels[status] ?? status}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {showActions && (
                    <td className="member-table-actions-cell">
                      <div className="member-actions-stack">
                        <div className={`member-actions-inline ${hasActionControls ? '' : 'is-disabled'}`.trim()}>
                          {canChangeTeam && (
                            <button
                              type="button"
                              className="member-action-btn member-action-btn-secondary"
                              onClick={() => onOpenTeamChange?.(member)}
                            >
                              팀 변경 <ArrowLeftRight size={14} />
                            </button>
                          )}
                          {menuItems.length > 0 && (
                            <ActionMenu items={menuItems} />
                          )}
                          {!hasActionControls && (
                            <span className="member-actions-disabled">관리 불가</span>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
