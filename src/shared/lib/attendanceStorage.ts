const ATTENDANCE_STORAGE_PREFIX = 'yanus-work-'

export const ATTENDANCE_STORAGE_KEYS = {
  session: 'yanus-work-session',
  days: 'yanus-work-days',
  weekPatterns: 'yanus-work-week-patterns',
  endsNextDay: 'yanus-work-ends-next-day',
} as const

export function getUserAttendanceStorageKey(
  key: string,
  userId: string | null | undefined,
): string | null {
  if (!userId) return null
  return `${key}:${encodeURIComponent(userId)}`
}

export function clearAttendanceStorage() {
  const keysToRemove = Object.keys(localStorage)
    .filter((key) => key.startsWith(ATTENDANCE_STORAGE_PREFIX))

  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }
}
