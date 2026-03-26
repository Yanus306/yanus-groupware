import type { ReactNode } from 'react'
import './SectionHeader.css'

interface SectionHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
}

export function SectionHeader({ title, description, eyebrow, actions }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header-copy">
        {eyebrow && <span className="section-header-eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="section-header-actions">{actions}</div>}
    </div>
  )
}
