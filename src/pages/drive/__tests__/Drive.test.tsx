import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { driveHandlers } from '../../../shared/api/mock/handlers/drive'
import { Drive } from '../index'

const server = setupServer(...driveHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Drive 페이지', () => {
  it('파일 드라이브 제목이 렌더링된다', () => {
    render(<Drive />)
    expect(screen.getByText('파일 드라이브')).toBeInTheDocument()
  })

  it('업로드 버튼이 렌더링된다', () => {
    render(<Drive />)
    expect(screen.getByText('업로드')).toBeInTheDocument()
  })

  it('파일 목록을 로드한다', async () => {
    render(<Drive />)
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1)
    })
  })
})
