import { X } from 'lucide-react'
import type { RefObject } from 'react'
import { TimeInput } from '../../../components/TimeInput'

interface Props {
  open: boolean
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  inputRef: RefObject<HTMLInputElement | null>
  onTitleChange: (v: string) => void
  onStartDateChange: (v: string) => void
  onStartTimeChange: (v: string) => void
  onEndDateChange: (v: string) => void
  onEndTimeChange: (v: string) => void
  onAdd: () => void
  onClose: () => void
}

export function AddEventModal({
  open, title, startDate, startTime, endDate, endTime, inputRef,
  onTitleChange, onStartDateChange, onStartTimeChange, onEndDateChange, onEndTimeChange,
  onAdd, onClose,
}: Props) {
  if (!open) return null
  return (
    <div className="edit-task-modal-overlay" onClick={onClose}>
      <div className="edit-task-modal add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-task-header">
          <h4>일정 추가</h4>
          <button className="edit-task-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="add-task-inline add-task-vertical">
          <div className="add-task-row">
            <label>제목</label>
            <input ref={inputRef} className="add-task-title" placeholder="일정 제목" value={title}
              onChange={(e) => onTitleChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} />
          </div>
          <div className="add-task-row">
            <label>시작 (날짜 · 시간)</label>
            <div className="add-event-datetime">
              <input type="date" className="add-task-date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
              <TimeInput value={startTime} onChange={onStartTimeChange} />
            </div>
          </div>
          <div className="add-task-row">
            <label>종료 (날짜 · 시간)</label>
            <div className="add-event-datetime">
              <input type="date" className="add-task-date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
              <TimeInput value={endTime} onChange={onEndTimeChange} />
            </div>
          </div>
          <div className="edit-task-actions add-task-modal-actions">
            <button className="cancel-btn" onClick={onClose}>취소</button>
            <button className="add-btn" onClick={onAdd}>추가</button>
          </div>
        </div>
      </div>
    </div>
  )
}
