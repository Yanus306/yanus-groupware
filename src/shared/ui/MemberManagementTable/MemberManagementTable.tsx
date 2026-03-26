import { ArrowLeftRight, ChevronDown, Crown } from 'lucide-react'
import type { User } from '../../../entities/user/model/types'
import { formatTeamName } from '../../lib/team'
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

interface MemberManagementTableProps {
  members: User[]
  saving?: boolean
  emptyMessage?: string
  showStatus?: boolean
  showActions?: boolean
  onOpenRoleChange?: (member: User) => void
  onOpenTeamChange?: (member: User) => void
  onDeactivate?: (memberId: string) => void
  onActivate?: (memberId: string) => void
  onExpel?: (memberId: string) => void
}

export function MemberManagementTable({
  members,
  saving = false,
  emptyMessage = '표시할 멤버가 없습니다.',
  showStatus = false,
  showActions = false,
  onOpenRoleChange,
  onOpenTeamChange,
  onDeactivate,
  onActivate,
  onExpel,
}: MemberManagementTableProps) {
  const showRoleChange = typeof onOpenRoleChange === 'function'
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
            {showStatus && <th>상태</th>}
            {showActions && <th>관리</th>}
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
                        <span className={`member-status-tag ${status}`}>
                          {statusLabels[status] ?? status}
                        </span>
                        {showStatusAction && (
                          isInactive ? (
                            <button
                              type="button"
                              className="member-action-btn activate-btn"
                              disabled={saving || !onActivate}
                              onClick={() => onActivate?.(member.id)}
                            >
                              활성화
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="member-action-btn mute-btn"
                              disabled={saving || !onDeactivate}
                              onClick={() => onDeactivate?.(member.id)}
                            >
                              비활성화
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  )}
                  {showActions && (
                    <td className="member-table-actions-cell">
                      <div className="member-actions-stack">
                        {showTeamChange && (
                          <button
                            type="button"
                            className="member-action-btn member-action-btn-secondary"
                            onClick={() => onOpenTeamChange?.(member)}
                          >
                            팀 변경 <ArrowLeftRight size={14} />
                          </button>
                        )}
                        {showRoleChange && (
                          <button
                            type="button"
                            className="member-action-btn member-action-btn-secondary"
                            onClick={() => onOpenRoleChange?.(member)}
                          >
                            역할 변경 <ChevronDown size={14} />
                          </button>
                        )}
                        {showExpel && (
                          <button
                            type="button"
                            className="member-action-btn expel-btn"
                            disabled={saving || isInactive}
                            onClick={() => onExpel?.(member.id)}
                          >
                            {isInactive ? '퇴출됨' : '퇴출'}
                          </button>
                        )}
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
