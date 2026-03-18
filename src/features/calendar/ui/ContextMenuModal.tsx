import { X, ListTodo, CalendarDays } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onAddMyTask: () => void
  onAddTeamTask: () => void
  onAddEvent: () => void
}

export function ContextMenuModal({ open, onClose, onAddMyTask, onAddTeamTask, onAddEvent }: Props) {
  if (!open) return null
  return (
    <div className="edit-task-modal-overlay" onClick={onClose}>
      <div className="edit-task-modal context-menu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-task-header">
          <h4>추가하기</h4>
          <button className="edit-task-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="context-menu-options">
          <button className="context-menu-option" onClick={onAddMyTask}>
            <ListTodo size={20} /><span>내 할일 추가</span>
          </button>
          <button className="context-menu-option" onClick={onAddTeamTask}>
            <ListTodo size={20} /><span>팀 할일 추가</span>
          </button>
          <button className="context-menu-option" onClick={onAddEvent}>
            <CalendarDays size={20} /><span>일정 추가</span>
          </button>
        </div>
      </div>
    </div>
  )
}
