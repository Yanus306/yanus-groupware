import { chatHandlers } from './chat'
import { calendarHandlers } from './calendar'
import { driveHandlers } from './drive'

// auth, attendance, members는 실제 백엔드(api.yanus.bond)로 직접 요청
// chat, calendar, drive는 백엔드 미구현으로 MSW mock 유지
export const handlers = [
  ...chatHandlers,
  ...calendarHandlers,
  ...driveHandlers,
]
