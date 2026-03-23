import type { CalendarEvent } from '../model/EventsProvider'
import type { EventInput } from '@fullcalendar/core'
import type { Task } from '../../tasks/model'

export function formatTimeForDisplay(time24: string): string {
  if (!time24) return '--:--'
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? '오후' : '오전'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function getCurrentTimeStr(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

export function formatEventRange(
  e: Pick<CalendarEvent, 'startDate' | 'startTime' | 'endDate' | 'endTime'>
): string {
  const fmt = (d: string, t: string) => {
    const [, m, day] = d.split('-').map(Number)
    const [h, min] = t.split(':').map(Number)
    const period = h >= 12 ? '오후' : '오전'
    const h12 = h % 12 || 12
    return `${m}월 ${day}일 ${period} ${h12}:${String(min).padStart(2, '0')}`
  }
  return `${fmt(e.startDate, e.startTime)} ~ ${fmt(e.endDate, e.endTime)}`
}

export function parseDisplayTimeTo24(displayTime: string): string {
  if (!displayTime || displayTime === '--:--') return '09:00'
  const parts = displayTime.trim().split(' ')
  const [timePart, period] = parts.length >= 2 ? [parts[0], parts[1]] : [parts[0], '']
  const [h12, m] = timePart.split(':').map(Number)
  if (isNaN(h12)) return '09:00'
  let h24: number
  if (period === '오전') h24 = h12 === 12 ? 0 : h12
  else if (period === '오후') h24 = h12 === 12 ? 12 : h12 + 12
  else return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
  return `${String(h24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

export function toOurEventFormat(e: CalendarEvent): EventInput {
  return {
    id: e.id,
    title: e.title,
    start: `${e.startDate}T${e.startTime}:00`,
    end: `${e.endDate}T${e.endTime}:00`,
    allDay: false,
    extendedProps: { rawEvent: e, isTask: false },
  }
}

export function taskToEventFormat(t: Task): EventInput {
  const time24 = parseDisplayTimeTo24(t.time)
  const [h, m] = time24.split(':').map(Number)
  const endDate = new Date(`${t.date}T12:00:00`)
  endDate.setHours(h + 1, m, 0, 0)
  const endStr = `${t.date}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`
  return {
    id: `task-${t.id}`,
    title: t.title,
    start: `${t.date}T${time24}:00`,
    end: endStr,
    allDay: false,
    extendedProps: { rawTask: t, isTask: true },
    // 팀 할일은 별도 클래스로 색상 구분
    className: `fc-event-task fc-event-priority-${t.priority}${t.isTeamTask ? ' fc-event-team-task' : ''}`,
    durationEditable: false,
  }
}

export function parseDateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
