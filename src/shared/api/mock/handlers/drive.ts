import { http, HttpResponse } from 'msw'

let mockFiles = [
  { id: '1', name: '프로젝트 기획서.pdf', type: 'application/pdf', size: 204800, uploadedBy: '1', uploadedAt: '2026-03-15T10:00:00Z', folder: null },
  { id: '2', name: '디자인 시안 v2.fig', type: 'application/figma', size: 1048576, uploadedBy: '2', uploadedAt: '2026-03-16T14:30:00Z', folder: '디자인' },
  { id: '3', name: '회의록_0318.docx', type: 'application/docx', size: 51200, uploadedBy: '1', uploadedAt: '2026-03-18T11:00:00Z', folder: null },
]

export const driveHandlers = [
  http.get('/drive/files', () => {
    return HttpResponse.json(mockFiles)
  }),

  http.post('/drive/upload', async ({ request }) => {
    let fileName = 'unknown'
    let fileType = 'application/octet-stream'
    let fileSize = 0
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (file) {
        fileName = file.name
        fileType = file.type
        fileSize = file.size
      }
    } catch {
      // node 환경에서 formData 파싱 실패 시 기본값 사용
    }
    const newFile = {
      id: `f${Date.now()}`,
      name: fileName,
      type: fileType,
      size: fileSize,
      uploadedBy: '1',
      uploadedAt: new Date().toISOString(),
      folder: null,
    }
    mockFiles = [...mockFiles, newFile]
    return HttpResponse.json(newFile, { status: 201 })
  }),

  http.delete('/drive/files/:id', ({ params }) => {
    mockFiles = mockFiles.filter((f) => f.id !== params.id)
    return HttpResponse.json({ success: true })
  }),
]
