import { useState, useEffect, useRef } from 'react'
import { FileText, Image, Upload, Trash2, Download, Files, HardDrive, Clock3, Sparkles } from 'lucide-react'
import { getFiles, uploadFile, deleteFile, downloadFile } from '../../shared/api/driveApi'
import type { DriveFile } from '../../shared/api/driveApi'
import { Toast } from '../../shared/ui/Toast'
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

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date))

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const latestFile = [...files].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const uploaderCount = new Set(files.map((file) => file.uploadedById)).size

  return (
    <div className="drive-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}

      <header className="drive-header">
        <div className="drive-header-copy">
          <p className="drive-kicker">Shared Library</p>
          <h1>파일 드라이브</h1>
          <p className="drive-subtitle">
            최근 산출물과 문서를 한눈에 보고, 바로 업로드와 다운로드를 이어갈 수 있게 정리했습니다.
          </p>
        </div>
        <div className="drive-header-actions">
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={18} />
            {uploading ? '업로드 중...' : '파일 업로드'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </header>

      <section className="drive-overview">
        <article className="drive-stat-card glass">
          <span className="drive-stat-icon">
            <Files size={18} />
          </span>
          <div>
            <span className="drive-stat-label">총 파일</span>
            <strong>{files.length}개</strong>
          </div>
        </article>
        <article className="drive-stat-card glass">
          <span className="drive-stat-icon">
            <HardDrive size={18} />
          </span>
          <div>
            <span className="drive-stat-label">사용 용량</span>
            <strong>{formatSize(totalSize || 0)}</strong>
          </div>
        </article>
        <article className="drive-stat-card glass">
          <span className="drive-stat-icon">
            <Clock3 size={18} />
          </span>
          <div>
            <span className="drive-stat-label">최근 업로드</span>
            <strong>{latestFile ? formatDate(latestFile.createdAt) : '-'}</strong>
          </div>
        </article>
      </section>

      <div className="drive-layout">
        <aside className="drive-side-panel glass">
          <div className="drive-panel-head">
            <span className="drive-panel-badge">
              <Sparkles size={14} />
              정리된 업로드 흐름
            </span>
            <h3>빠른 업로드</h3>
            <p>회의록, 산출물, 참고 자료를 바로 올리고 팀원이 즉시 확인할 수 있게 구성했습니다.</p>
          </div>
          <button
            className="upload-cta"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={18} />
            {uploading ? '업로드 중...' : '새 파일 추가'}
          </button>
          <div className="drive-side-stats">
            <div>
              <span>업로드 참여자</span>
              <strong>{uploaderCount}명</strong>
            </div>
            <div>
              <span>대표 업로더</span>
              <strong>{latestFile?.uploadedByName ?? '-'}</strong>
            </div>
          </div>
        </aside>

        <section className="drive-content glass">
          <div className="drive-section-head">
            <div>
              <h3>파일 라이브러리</h3>
              <p>이름, 업로더, 업로드 시점을 함께 보여줘서 바로 찾을 수 있게 정리했습니다.</p>
            </div>
          </div>
          {files.length === 0 ? (
            <div className="drive-empty-state">
              <Files size={32} />
              <p>아직 업로드된 파일이 없습니다. 첫 문서를 올려 작업 흐름을 시작해보세요.</p>
            </div>
          ) : (
            <div className="file-list">
              {files.map((f) => (
                <article key={f.id} className="file-row">
                  <div className="file-main">
                    <span className="file-icon">{getFileIcon(f.contentType)}</span>
                    <div className="file-copy">
                      <strong className="file-name">{f.originalName}</strong>
                      <div className="file-meta-row">
                        <span className="file-meta">{f.uploadedByName}</span>
                        <span className="file-divider" />
                        <span className="file-meta">{formatDate(f.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="file-side">
                    <span className="file-size">{formatSize(f.size)}</span>
                    <div className="file-actions">
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
