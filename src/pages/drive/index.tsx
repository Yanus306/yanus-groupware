import { useState, useEffect, useRef } from 'react'
import { FileText, Image, Upload, Trash2, Download, Files, HardDrive, Clock3, Sparkles } from 'lucide-react'
import { getFiles, uploadFile, deleteFile, downloadFile } from '../../shared/api/driveApi'
import type { DriveFile } from '../../shared/api/driveApi'
import { useApp } from '../../features/auth/model'
import { DEFAULT_SIGNUP_TEAM_NAME } from '../../shared/lib/team'
import { Toast } from '../../shared/ui/Toast'
import './drive.css'

export function Drive() {
  const { state } = useApp()
  const [files, setFiles] = useState<DriveFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortFilesByNewest = (items: DriveFile[]) =>
    [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  useEffect(() => {
    getFiles()
      .then((items) => setFiles(sortFilesByNewest(items)))
      .catch(() => setErrorMessage('파일 목록을 불러오지 못했습니다'))
  }, [])

  const isNewHireTeam = (state.currentUser?.team ?? '') === DEFAULT_SIGNUP_TEAM_NAME

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isNewHireTeam) {
      setErrorMessage('신입 팀은 파일을 업로드할 수 없습니다')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const newFile = await uploadFile(file)
      setFiles((prev) => sortFilesByNewest([...prev, newFile]))
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
      getFiles().then((items) => setFiles(sortFilesByNewest(items))).catch(() => {})
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
  const currentUserName = state.currentUser?.name ?? '모든 멤버'

  return (
    <div className="drive-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}

      <header className="drive-header">
        <div className="drive-header-copy">
          <p className="drive-kicker">Shared Library</p>
          <p className="drive-subtitle">
            모든 멤버가 함께 쓰는 공용 문서함입니다. 업로드한 파일은 팀 전체가 바로 확인할 수 있습니다.
          </p>
        </div>
        <div className="drive-header-actions">
          <span className="drive-access-badge">전체 멤버 공유</span>
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isNewHireTeam}
          >
            <Upload size={18} />
            {isNewHireTeam ? '신입 팀은 업로드 불가' : uploading ? '업로드 중...' : '공용 파일 업로드'}
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
              팀 공유 라이브러리
            </span>
            <h3>빠른 공유 업로드</h3>
            <p>회의록, 산출물, 참고 자료를 올리면 일반 멤버를 포함한 팀 전체가 바로 같은 파일을 확인합니다.</p>
          </div>
          <button
            className="upload-cta"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isNewHireTeam}
          >
            <Upload size={18} />
            {isNewHireTeam ? '신입 팀은 업로드 불가' : uploading ? '업로드 중...' : '새 공유 파일 추가'}
          </button>
          <div className="drive-access-note">
            <span>현재 사용자</span>
            <strong>{currentUserName}</strong>
            <p>
              {isNewHireTeam
                ? '신입 팀은 공유 드라이브를 조회만 할 수 있고 파일 업로드는 제한됩니다.'
                : '일반 멤버, 팀장, 관리자 모두 같은 공유 드라이브를 사용합니다.'}
            </p>
          </div>
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
