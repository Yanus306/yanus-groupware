import { http, HttpResponse } from 'msw'

interface MockDriveFile {
  id: number
  originalName: string
  size: number
  contentType: string
  uploadedById: number
  uploadedByName: string
  createdAt: string
}

let nextId = 4
let mockFiles: MockDriveFile[] = [
  { id: 1, originalName: '프로젝트 기획서.pdf', contentType: 'application/pdf', size: 204800, uploadedById: 1, uploadedByName: '김리더', createdAt: '2026-03-15T10:00:00Z' },
  { id: 2, originalName: '디자인 시안 v2.fig', contentType: 'application/figma', size: 1048576, uploadedById: 2, uploadedByName: '박팀장', createdAt: '2026-03-16T14:30:00Z' },
  { id: 3, originalName: '회의록_0318.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 51200, uploadedById: 1, uploadedByName: '김리더', createdAt: '2026-03-18T11:00:00Z' },
]

const ok = <T>(data: T) => HttpResponse.json({ code: 'SUCCESS', message: 'ok', data })

export const driveHandlers = [
  http.get('/api/v1/drive', () => {
    return ok(mockFiles)
  }),

  http.post('/api/v1/drive/upload', async ({ request }) => {
    let fileName = 'unknown'
    let fileType = 'application/octet-stream'
    let fileSize = 0
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (file) {
        fileName = file.name
        fileType = file.type || 'application/octet-stream'
        fileSize = file.size
      }
    } catch {
      // node 환경에서 formData 파싱 실패 시 기본값 사용
    }
    const newFile: MockDriveFile = {
      id: nextId++,
      originalName: fileName,
      contentType: fileType,
      size: fileSize,
      uploadedById: 1,
      uploadedByName: '김리더',
      createdAt: new Date().toISOString(),
    }
    mockFiles = [...mockFiles, newFile]
    return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: newFile }, { status: 201 })
  }),

  http.get('/api/v1/drive/:fileId/download', ({ params }) => {
    const id = Number(params.fileId)
    const file = mockFiles.find((f) => f.id === id)
    if (!file) return new HttpResponse(null, { status: 404 })
    return HttpResponse.arrayBuffer(new TextEncoder().encode('dummy-file-content').buffer as ArrayBuffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
    })
  }),

  http.delete('/api/v1/drive/:fileId', ({ params }) => {
    const id = Number(params.fileId)
    mockFiles = mockFiles.filter((f) => f.id !== id)
    return ok(null)
  }),
]
