import type { ReactNode } from 'react'
import { SectionHeader } from '../SectionHeader'
import './DataTableSection.css'

interface DataTableSectionProps {
  title: string
  description?: string
  className?: string
  children: ReactNode
}

interface DataTableScrollProps {
  className?: string
  children: ReactNode
}

export function DataTableSection({ title, description, className = '', children }: DataTableSectionProps) {
  return (
    <section className={`data-table-section glass ${className}`.trim()}>
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  )
}

export function DataTableScroll({ className = '', children }: DataTableScrollProps) {
  return (
    <div className={`data-table-scroll ${className}`.trim()}>
      {children}
    </div>
  )
}
