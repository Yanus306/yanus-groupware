import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading = false, children, disabled, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
    >
      {loading ? '로딩 중...' : children}
    </button>
  )
}
