export function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateDisplay(dateStr: string, baseDate: Date): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (taskDay.getTime() === today.getTime()) return '오늘'
  if (taskDay.getTime() === tomorrow.getTime()) return '내일'
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${days[d.getDay()]}요일, ${d.getMonth() + 1}월 ${d.getDate()}일`
}
