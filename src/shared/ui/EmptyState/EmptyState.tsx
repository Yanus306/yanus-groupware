import type { ReactNode } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`empty-state-panel ${compact ? 'compact' : ''}`}>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
