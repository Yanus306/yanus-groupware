import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { AppProvider } from '../../../auth/model/AppProvider'
import { SetWorkDaysPersonal } from '../SetWorkDaysPersonal'
import type { ReactNode } from 'react'

const server = setupServer(
  http.get('/api/v1/work-schedules/me', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: [
        { id: 1, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
        { id: 2, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00' },
        { id: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00' },
        { id: 4, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00' },
        { id: 5, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00' },
      ],
    }),
  ),
  http.put('/api/v1/work-schedules', async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { id: Date.now(), ...body } })
  }),
  http.get('/api/v1/me', () =>
    HttpResponse.json({ code: 'ERROR', message: 'unauthorized' }, { status: 401 }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>

describe('SetWorkDaysPersonal', () => {
  it('저장된 스케줄이 없으면 처음에는 모든 요일이 휴무 상태다', async () => {
    server.use(
      http.get('/api/v1/work-schedules/me', () =>
        HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: [] }),
      ),
    )

    render(<SetWorkDaysPersonal />, { wrapper })

    await waitFor(() => {
      expect(screen.getAllByText('휴무').length).toBe(7)
    })
  })

  it('7개의 요일 이름이 렌더링된다', async () => {
    render(<SetWorkDaysPersonal />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })
  })

  it('활성화된 요일(월-금)에 출근/퇴근 라벨이 표시된다', async () => {
    render(<SetWorkDaysPersonal />, { wrapper })
    await waitFor(() => {
      const checkInLabels = screen.getAllByText('출근')
      expect(checkInLabels.length).toBe(5)
    })
  })

  it('비활성 요일(토/일)에는 출근/퇴근 라벨이 없다', async () => {
    render(<SetWorkDaysPersonal />, { wrapper })
    await waitFor(() => {
      const checkInLabels = screen.getAllByText('출근')
      expect(checkInLabels.length).toBe(5)
    })
  })

  it('요일 토글 클릭 시 해당 요일 시간 입력이 나타난다', async () => {
    render(<SetWorkDaysPersonal />, { wrapper })
    await waitFor(() => expect(screen.getAllByText('출근').length).toBe(5))

    const toggleButtons = screen.getAllByRole('button').filter((btn) => btn.classList.contains('toggle'))
    fireEvent.click(toggleButtons[5])

    await waitFor(() => {
      const checkInLabels = screen.getAllByText('출근')
      expect(checkInLabels.length).toBe(6)
    })
  })

  it('활성 요일에는 반복 주차 선택 버튼이 표시된다', async () => {
    render(<SetWorkDaysPersonal />, { wrapper })

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '매주' }).length).toBe(5)
    })
  })

  it('저장 버튼이 존재한다', async () => {
    render(<SetWorkDaysPersonal />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('저장')).toBeInTheDocument()
    })
  })
})
