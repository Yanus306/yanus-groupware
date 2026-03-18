import { authHandlers } from './auth'
import { attendanceHandlers } from './attendance'
import { chatHandlers } from './chat'
import { calendarHandlers } from './calendar'
import { driveHandlers } from './drive'
import { membersHandlers } from './members'

export const handlers = [
  ...authHandlers,
  ...attendanceHandlers,
  ...chatHandlers,
  ...calendarHandlers,
  ...driveHandlers,
  ...membersHandlers,
]
