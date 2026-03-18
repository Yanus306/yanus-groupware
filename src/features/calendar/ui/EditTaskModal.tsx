import { X } from 'lucide-react'
import { useRef, useEffect } from 'react'
import type { Task, TaskPriority } from '../../tasks/model'
import type { User } from '../../../entities/user/model/types'

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

interface Props {
  task: Task | null
  currentUserId: string | undefined
  users: User[]
  assigneeId: string
  priority: TaskPriority
  onAssigneeChange: (id: string) => void
  onPriorityChange: (p: TaskPriority) => void
  onSave: () => void
  onClose: () => void
  editInputRef: React.RefObject<HTMLInputElement>
}

export function EditTaskModal({
  task, currentUserId, users, assigneeId, priority,
  onAssigneeChange, onPriorityChange, onSave, onClose, editInputRef,
}: Props) {
  if (!task) return null
  return (
    <div className="edit-task-modal-overlay" onClick={onClose}>
      <div className="edit-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-task-header">
          <div className="edit-task-header-title">
            <h4>태스크 수정</h4>
            <span className={"task-type-badge " + (!task.assigneeId || task.assigneeId === currentUserId ? 'my' : 'team')}>
              {!task.assigneeId || task.assigneeId === currentUserId
                ? '내 할일'
                : task.assigneeId === 'all' ? '팀 할일 · 팀원 전체' : `팀 할일 · ${task.assigneeName || '담당자'}`}
            </span>
          </div>
          <button className="edit-task-close" onClick={onClose}><X size={20} /></button>
        </div>
        <input ref={editInputRef} className="edit-task-title" defaultValue={task.title} placeholder="할일 제목" />
        <div className="add-task-row" style={{ marginTop: 12 }}>
          <label>중요도</label>
          <select className="add-task-priority" value={priority} onChange={(e) => onPriorityChange(e.target.value as TaskPriority)}>
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="add-task-row">
          <label>담당자</label>
          <select className="add-task-assignee" value={assigneeId} onChange={(e) => onAssigneeChange(e.target.value)}>
            <option value="">담당자 없음 (내 할일)</option>
            <option value="all">팀원 전체</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="edit-task-actions">
          <button className="cancel-btn" onClick={onClose}>취소</button>
          <button className="add-btn" onClick={onSave}>저장</button>
        </div>
      </div>
    </div>
  )
}
