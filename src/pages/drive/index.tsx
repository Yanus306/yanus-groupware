import { useState, useEffect, useRef } from 'react'
import { FileText, Image, Upload, Trash2, Download } from 'lucide-react'
import { getFiles, uploadFile, deleteFile, downloadFile } from '../../shared/api/driveApi'
import type { DriveFile } from '../../shared/api/driveApi'
import './drive.css'

export function Drive() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getFiles()
      .then(setFiles)
      .catch(() => setErrorMessage('파일 목록을 불러오지 못했습니다'))
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const newFile = await uploadFile(file)
      setFiles((prev) => [...prev, newFile])
    } catch {
      setErrorMessage('파일 업로드에 실패했습니다')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    try {
      await deleteFile(id)
    } catch {
      setErrorMessage('파일 삭제에 실패했습니다')
      getFiles().then(setFiles).catch(() => {})
    }
  }

  const handleDownload = async (file: DriveFile) => {
    try {
      const url = await downloadFile(file.id)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErrorMessage('파일 다운로드에 실패했습니다')
    }
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image size={20} />
    return <FileText size={20} />
  }

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div className="drive-page">
      {errorMessage && (
        <div className="drive-toast error" role="alert">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      <header className="drive-header">
        <h1>파일 드라이브</h1>
        <button
          className="upload-btn glass"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={18} />
          {uploading ? '업로드 중...' : '업로드'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </header>

      <div className="drive-content glass">
        <section className="recent-section">
          <h3>파일 목록</h3>
          {files.length === 0 ? (
            <p className="empty-msg">파일이 없습니다.</p>
          ) : (
            <div className="file-list">
              {files.map((f) => (
                <div key={f.id} className="file-row">
                  <span className="file-icon">{getFileIcon(f.contentType)}</span>
                  <span className="file-name">{f.originalName}</span>
                  <span className="file-meta">{f.uploadedByName}</span>
                  <span className="file-size">{formatSize(f.size)}</span>
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(f)}
                    title="다운로드"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(f.id)}
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
