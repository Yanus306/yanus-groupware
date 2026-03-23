import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { driveHandlers } from '../mock/handlers/drive'
import { getFiles, uploadFile, deleteFile, downloadFile } from '../driveApi'

// jsdom에서 URL.createObjectURL 미구현 → 메서드만 스텁
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()

const server = setupServer(...driveHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('driveApi', () => {
  it('getFiles() 파일 목록을 반환한다', async () => {
    const files = await getFiles()
    expect(files).toHaveLength(3)
    expect(files[0]).toHaveProperty('originalName')
    expect(files[0]).toHaveProperty('contentType')
    expect(typeof files[0].id).toBe('number')
  })

  it('uploadFile() 파일을 업로드하고 새 파일 정보를 반환한다', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const result = await uploadFile(file)
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('originalName')
    expect(result).toHaveProperty('contentType')
  })

  it('deleteFile() 파일을 삭제한다', async () => {
    await expect(deleteFile(1)).resolves.not.toThrow()
  })

  it('downloadFile() Blob URL을 반환한다', async () => {
    const url = await downloadFile(2)
    expect(typeof url).toBe('string')
    expect(url.length).toBeGreaterThan(0)
  })
})
