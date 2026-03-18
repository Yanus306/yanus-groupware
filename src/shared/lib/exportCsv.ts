export interface AttendanceExportRow {
  id: string
  userId: string
  userName?: string
  date: string
  clockIn: string
  clockOut?: string
  status: 'working' | 'done'
}

export function exportAttendanceToCsv(records: AttendanceExportRow[], filename: string): void {
  const header = ['ID', '사용자 ID', '이름', '날짜', '출근', '퇴근', '상태']
  const rows = records.map((r) => [
    r.id,
    r.userId,
    r.userName ?? '',
    r.date,
    r.clockIn,
    r.clockOut ?? '-',
    r.status === 'done' ? 'Present' : 'Working',
  ])

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance_${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
