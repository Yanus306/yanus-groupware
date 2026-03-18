import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { driveHandlers } from '../mock/handlers/drive'
import { getFiles, uploadFile, deleteFile } from '../driveApi'

const server = setupServer(...driveHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('driveApi', () => {
  it('getFiles() 파일 목록을 반환한다', async () => {
    const files = await getFiles()
    expect(files).toHaveLength(3)
    expect(files[0]).toHaveProperty('name')
    expect(files[0]).toHaveProperty('type')
  })

  it('uploadFile() 파일을 업로드하고 새 파일 정보를 반환한다', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const result = await uploadFile(file)
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('type')
  })

  it('deleteFile() 파일을 삭제하고 success를 반환한다', async () => {
    const result = await deleteFile('1')
    expect(result).toEqual({ success: true })
  })
})
