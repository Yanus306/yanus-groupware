import { useState, useRef, useCallback, useEffect } from 'react'
import './ClockTimePicker.css'

interface ClockTimePickerProps {
  value: string // HH:mm or empty
  onChange: (value: string) => void
}

function parseTime(value: string): { hour: number; minute: number } {
  if (!value || !value.match(/^\d{1,2}:\d{2}$/)) {
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  }
  const [h, m] = value.split(':').map(Number)
  return { hour: h, minute: m }
}

function toTimeStr(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function ClockTimePicker({ value, onChange }: ClockTimePickerProps) {
  const { hour, minute } = parseTime(value)
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null)
  const clockRef = useRef<HTMLDivElement>(null)

  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6

  const getAngle = useCallback((clientX: number, clientY: number) => {
    const el = clockRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360
    return angle
  }, [])

  const handleStart = (e: React.MouseEvent | React.TouchEvent, mode: 'hour' | 'minute') => {
    e.preventDefault()
    setDragging(mode)
  }

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const angle = getAngle(clientX, clientY)

      if (dragging === 'hour') {
        let h = Math.round(angle / 30) % 12
        if (h === 0) h = 12
        const hour24 = h === 12 ? (hour >= 12 ? 12 : 0) : (hour >= 12 ? h + 12 : h)
        onChange(toTimeStr(hour24, minute))
      } else {
        const m = Math.round(angle / 6) % 60
        onChange(toTimeStr(hour, m))
      }
    },
    [dragging, hour, minute, getAngle, onChange]
  )

  const handleEnd = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (!dragging) return
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [dragging, handleMove, handleEnd])

  const displayHour = hour % 12 || 12
  const displayMin = String(minute).padStart(2, '0')
  const ampm = hour < 12 ? '오전' : '오후'

  return (
    <div className="clock-time-picker">
      <div
        ref={clockRef}
        className="clock-face"
        onMouseMove={dragging ? (e) => handleMove(e.nativeEvent) : undefined}
        onMouseUp={dragging ? handleEnd : undefined}
        onMouseLeave={dragging ? handleEnd : undefined}
      >
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => (
          <span
            key={n}
            className="clock-mark"
            style={{ transform: `rotate(${i * 30}deg) translateY(-58px)` }}
          >
            {n}
          </span>
        ))}
        <div
          className={`clock-hand hour-hand ${dragging === 'hour' ? 'active' : ''}`}
          style={{ transform: `rotate(${hourAngle}deg)` }}
          onMouseDown={(e) => handleStart(e, 'hour')}
          onTouchStart={(e) => handleStart(e, 'hour')}
        />
        <div
          className={`clock-hand minute-hand ${dragging === 'minute' ? 'active' : ''}`}
          style={{ transform: `rotate(${minuteAngle}deg)` }}
          onMouseDown={(e) => handleStart(e, 'minute')}
          onTouchStart={(e) => handleStart(e, 'minute')}
        />
        <div className="clock-center" />
      </div>
      <div className="clock-display">
        {ampm} {displayHour}:{displayMin}
      </div>
      <div className="clock-ampm-toggle">
        <button
          type="button"
          className={hour < 12 ? 'active' : ''}
          onClick={() => onChange(toTimeStr(hour < 12 ? hour : hour - 12, minute))}
        >
          오전
        </button>
        <button
          type="button"
          className={hour >= 12 ? 'active' : ''}
          onClick={() => onChange(toTimeStr(hour >= 12 ? hour : hour + 12, minute))}
        >
          오후
        </button>
      </div>
    </div>
  )
}
