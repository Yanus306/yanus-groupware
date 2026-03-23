import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { driveHandlers } from '../../../shared/api/mock/handlers/drive'
import { Drive } from '../index'

// jsdom에서 URL.createObjectURL 미구현 → 스텁
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()

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

  it('파일 목록을 로드하면 파일명이 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      expect(screen.getByText('프로젝트 기획서.pdf')).toBeInTheDocument()
    })
  })

  it('파일 목록에 다운로드 버튼이 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      const downloadBtns = screen.getAllByTitle('다운로드')
      expect(downloadBtns.length).toBeGreaterThan(0)
    })
  })

  it('파일 목록에 삭제 버튼이 표시된다', async () => {
    render(<Drive />)
    await waitFor(() => {
      const deleteBtns = screen.getAllByTitle('삭제')
      expect(deleteBtns.length).toBeGreaterThan(0)
    })
  })
})
