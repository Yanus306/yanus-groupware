import { describe, it, expect, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeProvider'

function ThemeConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme()

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={() => setTheme('light')}>
        라이트
      </button>
      <button type="button" onClick={toggleTheme}>
        토글
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('기본 테마를 다크로 적용한다', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('선택한 테마를 localStorage와 html 속성에 반영한다', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '라이트' }))

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(localStorage.getItem('yanus-theme')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('토글 시 라이트와 다크를 전환한다', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '토글' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    fireEvent.click(screen.getByRole('button', { name: '토글' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })
})
