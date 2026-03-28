import { baseClient } from './baseClient'

export type AuditLogAction = 'ROLE_CHANGE' | 'TEAM_CHANGE' | 'DEACTIVATE' | 'ACTIVATE'

export interface AuditLog {
  id: number
  actorId: number
  actorRole: string
  targetId: number
  action: AuditLogAction
  previousValue: string | null
  newValue: string | null
  createdAt: string
}

export const getAuditLogs = () =>
  baseClient.get<AuditLog[]>('/api/v1/audit-logs')
