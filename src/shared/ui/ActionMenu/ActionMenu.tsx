import { MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './ActionMenu.css'

export interface ActionMenuItem {
  label: string
  tone?: 'default' | 'danger' | 'success' | 'warning'
  disabled?: boolean
  onSelect: () => void
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  label?: string
}

export function ActionMenu({ items, label = '관리 메뉴 열기' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        type="button"
        className={`action-menu-trigger ${open ? 'open' : ''}`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="action-menu-popover" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`action-menu-item ${item.tone ?? 'default'}`}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
