import { useState, useCallback, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import './TimeInput.css'

interface TimeInputProps {
  value: string // HH:mm or empty
  onChange: (value: string) => void
}

function parseTime(value: string): { hour: number; minute: number } {
  if (!value || !value.match(/^\d{1,2}:\d{2}$/)) {
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  }
  const [h, m] = value.split(':').map(Number)
  return { hour: Math.min(23, Math.max(0, h)), minute: Math.min(59, Math.max(0, m)) }
}

function toTimeStr(hour: number, minute: number): string {
  return `${String(Math.min(23, Math.max(0, hour))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, minute))).padStart(2, '0')}`
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const { hour, minute } = parseTime(value)
  const [hourStr, setHourStr] = useState(String(hour).padStart(2, '0'))
  const [minuteStr, setMinuteStr] = useState(String(minute).padStart(2, '0'))

  const syncFromValue = useCallback(() => {
    const { hour: h, minute: m } = parseTime(value)
    setHourStr(String(h).padStart(2, '0'))
    setMinuteStr(String(m).padStart(2, '0'))
  }, [value])

  const applyHour = (h: number) => {
    const clamped = ((h % 24) + 24) % 24
    setHourStr(String(clamped).padStart(2, '0'))
    onChange(toTimeStr(clamped, minute))
  }

  const applyMinute = (m: number) => {
    const clamped = ((m % 60) + 60) % 60
    setMinuteStr(String(clamped).padStart(2, '0'))
    onChange(toTimeStr(hour, clamped))
  }

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '')
    setHourStr(v)
    if (v.length >= 2) {
      const n = parseInt(v.slice(-2), 10)
      applyHour(n)
    }
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '')
    setMinuteStr(v)
    if (v.length >= 2) {
      const n = parseInt(v.slice(-2), 10)
      applyMinute(n)
    }
  }

  const handleHourBlur = () => {
    const n = parseInt(hourStr, 10)
    if (!isNaN(n)) applyHour(n)
    else syncFromValue()
  }

  const handleMinuteBlur = () => {
    const n = parseInt(minuteStr, 10)
    if (!isNaN(n)) applyMinute(n)
    else syncFromValue()
  }

  const handleHourWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    applyHour(hour + (e.deltaY < 0 ? 1 : -1))
  }

  const handleMinuteWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    applyMinute(minute + (e.deltaY < 0 ? 1 : -1))
  }

  useEffect(() => {
    syncFromValue()
  }, [value, syncFromValue])

  return (
    <div className="time-input">
      <div className="time-input-group">
        <input
          type="text"
          inputMode="numeric"
          className="time-input-field"
          value={hourStr}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
          onWheel={handleHourWheel}
        />
        <div className="time-input-arrows">
          <button type="button" onClick={() => applyHour(hour + 1)} aria-label="시간 증가">
            <ChevronUp size={16} />
          </button>
          <button type="button" onClick={() => applyHour(hour - 1)} aria-label="시간 감소">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
      <span className="time-input-sep">:</span>
      <div className="time-input-group">
        <input
          type="text"
          inputMode="numeric"
          className="time-input-field"
          value={minuteStr}
          onChange={handleMinuteChange}
          onBlur={handleMinuteBlur}
          onWheel={handleMinuteWheel}
        />
        <div className="time-input-arrows">
          <button type="button" onClick={() => applyMinute(minute + 1)} aria-label="분 증가">
            <ChevronUp size={16} />
          </button>
          <button type="button" onClick={() => applyMinute(minute - 1)} aria-label="분 감소">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
