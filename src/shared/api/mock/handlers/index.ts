import { chatHandlers } from './chat'
import { driveHandlers } from './drive'

// auth, members, attendance, calendar — 실제 백엔드(api.yanus.bond) 사용
// chat, drive — 백엔드 미구현으로 MSW mock 유지
export const handlers = [
  ...chatHandlers,
  ...driveHandlers,
]
