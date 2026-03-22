export interface CalendarEvent {
  id: string           // 내부 string 사용 (FullCalendar 호환)
  title: string
  startDate: string    // YYYY-MM-DD
  startTime: string    // HH:mm
  endDate: string      // YYYY-MM-DD
  endTime: string      // HH:mm
  createdBy: string    // createdByName
}
