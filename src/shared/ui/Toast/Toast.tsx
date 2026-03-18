import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div role="alert" className={`toast toast-${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" aria-label="닫기" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  )
}
