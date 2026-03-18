import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportAttendanceToCsv } from '../exportCsv'

describe('exportAttendanceToCsv', () => {
  beforeEach(() => {
    // jsdom에서 URL.createObjectURL mock
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('레코드 배열로 CSV 다운로드를 트리거한다', () => {
    const records = [
      { id: '1', userId: '1', userName: '김리더', date: '2026-03-18', clockIn: '09:00', clockOut: '18:00', status: 'done' as const },
      { id: '2', userId: '2', userName: '박팀장', date: '2026-03-18', clockIn: '09:30', clockOut: '18:30', status: 'done' as const },
    ]
    const spy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLElement)

    exportAttendanceToCsv(records, '2026-03-18')

    expect(spy).toHaveBeenCalledWith('a')
    spy.mockRestore()
  })

  it('빈 배열도 처리한다', () => {
    expect(() => exportAttendanceToCsv([], '2026-03-18')).not.toThrow()
  })
})
