import { motion } from 'framer-motion'

const size = 170
const strokeWidth = 18
const r = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * r

export type WorkStatus = 'idle' | 'working' | 'done'

type RingVariant = 'default' | 'start' | 'leave'

interface AnimatedClockRingProps {
  status: WorkStatus
  clockIn: Date | null
  clockOut: Date | null
  now: Date
  variant?: RingVariant
}

export function AnimatedClockRing({ status, clockIn, clockOut, now, variant = 'default' }: AnimatedClockRingProps) {
  let startFrac = 0
  let endFrac = 0

  if (clockIn) {
    const base = status === 'done' && clockOut ? clockOut : now
    const dayStart = new Date(base)
    dayStart.setHours(0, 0, 0, 0)
    const dayMs = 24 * 60 * 60 * 1000

    const startMs = clockIn.getTime() - dayStart.getTime()
    const endMs = base.getTime() - dayStart.getTime()

    startFrac = Math.min(1, Math.max(0, startMs / dayMs))
    endFrac = Math.min(1, Math.max(0, endMs / dayMs))
  }

  let fraction = 0
  if (clockIn) {
    if (status === 'working') {
      // 출근 후에는 현재 시간 위치에 작은 불빛처럼만 보이게
      startFrac = endFrac
      fraction = 0.08
    } else if (status === 'done') {
      // 퇴근 후에는 퇴근 시점 위치에 멈춘 작은 불빛
      startFrac = endFrac
      fraction = 0.08
    } else {
      fraction = Math.max(0.02, endFrac - startFrac)
    }
  }

  // 버튼 모드(출근/퇴근)는 전체 링이 꽉 차도록
  const isStart = variant === 'start'
  const isLeave = variant === 'leave'

  if (isStart || isLeave) {
    startFrac = 0
    fraction = 1
  }

  const strokeDasharray = `${circumference * fraction} ${circumference}`
  const strokeDashoffset = -startFrac * circumference

  const shouldRotate = variant === 'default' && status !== 'done'

  // 로고 색상 기반: 파랑 #72b8e8, 보라 #9680cc, 핑크 #d44a99
  const [c0, c1, c2] = isStart
    ? ['#3db87a', '#5ed4a0', '#3db87a'] // 출근 - 그린
    : isLeave
    ? ['#e05050', '#e87070', '#e05050'] // 퇴근 - 레드
    : ['#9680cc', '#72b8e8', '#9680cc'] // 기본 - 로고 보라→파랑

  const workingStops =
    variant === 'default' && status === 'working'
      ? {
          s0: ['#9680cc', '#72b8e8', '#d44a99', '#9680cc'],
          s1: ['#72b8e8', '#d44a99', '#9680cc', '#72b8e8'],
          s2: ['#d44a99', '#9680cc', '#72b8e8', '#d44a99'],
        }
      : null

  return (
    <svg width={size} height={size} className="clock-ring-svg">
      <defs>
        <motion.linearGradient
          id="clockGrad"
        >
          {shouldRotate && (
            <animate
              attributeName="gradientTransform"
              type="rotate"
              from="0 0.5 0.5"
              to="360 0.5 0.5"
              dur="6s"
              repeatCount="indefinite"
            />
          )}
          <motion.stop
            offset="0%"
            animate={{ stopColor: workingStops ? workingStops.s0 : c0 }}
            transition={workingStops ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4, ease: 'easeInOut' }}
          />
          <motion.stop
            offset="50%"
            animate={{ stopColor: workingStops ? workingStops.s1 : c1 }}
            transition={workingStops ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4, ease: 'easeInOut' }}
          />
          <motion.stop
            offset="100%"
            animate={{ stopColor: workingStops ? workingStops.s2 : c2 }}
            transition={workingStops ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4, ease: 'easeInOut' }}
          />
        </motion.linearGradient>
      </defs>

      {/* 배경 링 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(148, 163, 184, 0.25)"
        strokeWidth={strokeWidth}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />

      {/* 진행 링 / 버튼 링 */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#clockGrad)"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        animate={{ opacity: 1 }}
        initial={{ opacity: 0.9 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  )
}
