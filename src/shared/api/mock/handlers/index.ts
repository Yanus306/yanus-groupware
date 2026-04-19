import { attendanceHandlers } from './attendance'
import { authHandlers } from './auth'
import { calendarHandlers } from './calendar'
import { chatHandlers } from './chat'
import { driveHandlers } from './drive'
import { membersHandlers } from './members'
import { operationsHandlers } from './operations'

// 로컬 mock 모드에서는 핵심 사용자 흐름을 최대한 실제처럼 점검할 수 있게
// 이미 준비된 도메인 핸들러를 함께 등록한다.
export const handlers = [
  ...authHandlers,
  ...membersHandlers,
  ...attendanceHandlers,
  ...calendarHandlers,
  ...operationsHandlers,
  ...chatHandlers,
  ...driveHandlers,
]
