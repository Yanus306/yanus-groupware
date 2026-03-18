import { X, Plus } from 'lucide-react'
import type { RefObject } from 'react'
import type { TaskPriority } from '../../tasks/model'
import type { User } from '../../../entities/user/model/types'
import { TimeInput } from '../../../components/TimeInput'

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

interface Props {
  open: boolean
  tabType: 'my' | 'team'
  title: string
  time: string
  date: string
  priority: TaskPriority
  assigneeId: string
  users: User[]
  inputRef: RefObject<HTMLInputElement>
  onTitleChange: (v: string) => void
  onTimeChange: (v: string) => void
  onDateChange: (v: string) => void
  onPriorityChange: (v: TaskPriority) => void
  onAssigneeChange: (v: string) => void
  onAdd: () => void
  onClose: () => void
}

export function AddTaskModal({
  open, tabType, title, time, date, priority, assigneeId, users, inputRef,
  onTitleChange, onTimeChange, onDateChange, onPriorityChange, onAssigneeChange,
  onAdd, onClose,
}: Props) {
  if (!open) return null
  return (
    <div className="edit-task-modal-overlay" onClick={onClose}>
      <div className="edit-task-modal add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-task-header">
          <div className="edit-task-header-title">
            <h4>할일 추가</h4>
            <span className={"task-type-badge " + (tabType === 'team' ? 'team' : 'my')}>
              {tabType === 'team' ? '팀 할일' : '내 할일'}
            </span>
          </div>
          <button className="edit-task-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="add-task-inline add-task-vertical">
          <div className="add-task-row">
            <label>할일</label>
            <input ref={inputRef} className="add-task-title" placeholder="할일 제목" value={title}
              onChange={(e) => onTitleChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} />
          </div>
          <div className="add-task-row">
            <label>마감 시간</label>
            <TimeInput value={time} onChange={onTimeChange} />
          </div>
          <div className="add-task-row">
            <label>마감 날짜</label>
            <input type="date" className="add-task-date" value={date} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <div className="add-task-row">
            <label>중요도</label>
            <select className="add-task-priority" value={priority} onChange={(e) => onPriorityChange(e.target.value as TaskPriority)}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {tabType === 'team' && (
            <div className="add-task-row">
              <label>담당자</label>
              <select className="add-task-assignee" value={assigneeId} onChange={(e) => onAssigneeChange(e.target.value)}>
                <option value="">담당자 없음</option>
                <option value="all">팀원 전체</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div className="edit-task-actions add-task-modal-actions">
            <button className="cancel-btn" onClick={onClose}>취소</button>
            <button className="add-btn" onClick={onAdd}><Plus size={18} />추가</button>
          </div>
        </div>
      </div>
    </div>
  )
}
