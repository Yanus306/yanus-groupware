export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  time: string
  date: string // YYYY-MM-DD
  priority: TaskPriority
  done: boolean
  isTeamTask: boolean
  assigneeId?: string       // 주 담당자 ID
  assigneeName?: string     // 주 담당자 이름
  memberIds?: string[]      // 추가 참여 멤버 ID 목록
  memberNames?: string[]    // 추가 참여 멤버 이름 목록
  createdBy: string
}
