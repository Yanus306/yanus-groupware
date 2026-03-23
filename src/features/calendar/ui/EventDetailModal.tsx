import { X } from 'lucide-react'
import type { CalendarEvent } from '../model/EventsProvider'
import { TimeInput } from '../../../components/TimeInput'
import { formatEventRange } from '../lib/calendarUtils'

interface EditForm {
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
}

interface Props {
  event: CalendarEvent | null
  canEdit: boolean
  editMode: boolean
  editForm: EditForm
  onEditFormChange: (f: Partial<EditForm>) => void
  onEnterEditMode: () => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
}

export function EventDetailModal({
  event, canEdit, editMode, editForm, onEditFormChange,
  onEnterEditMode, onSave, onDelete, onClose,
}: Props) {
  if (!event) return null
  return (
    <div className="edit-task-modal-overlay" onClick={onClose}>
      <div className="edit-task-modal add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-task-header">
          <h4>{editMode ? '일정 수정' : '일정 상세'}</h4>
          <button className="edit-task-close" onClick={onClose}><X size={20} /></button>
        </div>
        {editMode ? (
          <div className="add-task-inline add-task-vertical">
            <div className="add-task-row">
              <label>제목</label>
              <input className="add-task-title" placeholder="일정 제목" value={editForm.title}
                onChange={(e) => onEditFormChange({ title: e.target.value })} />
            </div>
            <div className="add-task-row">
              <label>시작 (날짜 · 시간)</label>
              <div className="add-event-datetime">
                <input type="date" className="add-task-date" value={editForm.startDate}
                  onChange={(e) => onEditFormChange({ startDate: e.target.value })} />
                <TimeInput value={editForm.startTime} onChange={(t) => onEditFormChange({ startTime: t })} />
              </div>
            </div>
            <div className="add-task-row">
              <label>종료 (날짜 · 시간)</label>
              <div className="add-event-datetime">
                <input type="date" className="add-task-date" value={editForm.endDate}
                  onChange={(e) => onEditFormChange({ endDate: e.target.value })} />
                <TimeInput value={editForm.endTime} onChange={(t) => onEditFormChange({ endTime: t })} />
              </div>
            </div>
            <div className="edit-task-actions add-task-modal-actions">
              <button className="cancel-btn" onClick={() => onEditFormChange({})}>취소</button>
              <button className="add-btn" onClick={onSave}>저장</button>
            </div>
          </div>
        ) : (
          <>
            <div className="event-detail-view">
              <div className="event-detail-title">{event.title}</div>
              <div className="event-detail-meta">{formatEventRange(event)}</div>
            </div>
            <div className="event-detail-creator">
              작성자: {event.createdBy}
            </div>
            <div className="edit-task-actions add-task-modal-actions">
              {canEdit && <button className="cancel-btn" onClick={onEnterEditMode}>수정</button>}
              {canEdit && <button className="cancel-btn delete-btn" onClick={onDelete}>삭제</button>}
              <button className="add-btn" onClick={onClose}>닫기</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
