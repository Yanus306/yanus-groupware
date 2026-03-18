import { useState, useEffect, useRef } from 'react'
import { Folder, FileText, Image, Upload, Trash2, ChevronRight } from 'lucide-react'
import { getFiles, uploadFile, deleteFile } from '../../shared/api/driveApi'
import type { DriveFile } from '../../shared/api/driveApi'
import './drive.css'

const folderColors: Record<string, string> = {
  디자인: '#7c3aed',
  Documents: '#3b82f6',
  Projects: '#22c55e',
  Shared: '#ec4899',
}

export function Drive() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getFiles()
      .then(setFiles)
      .catch(() => {})
  }, [])

  const folders = [...new Set(files.map((f) => f.folder).filter(Boolean))] as string[]
  const visibleFiles = files.filter((f) => f.folder === currentFolder)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const newFile = await uploadFile(file)
      setFiles((prev) => [...prev, newFile])
    } catch {
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    try {
      await deleteFile(id)
    } catch {
      getFiles().then(setFiles).catch(() => {})
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image size={20} />
    return <FileText size={20} />
  }

  return (
    <div className="drive-page">
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
        <div className="breadcrumb">
          <button onClick={() => setCurrentFolder(null)}>드라이브</button>
          {currentFolder && (
            <span>
              <ChevronRight size={14} />
              <button>{currentFolder}</button>
            </span>
          )}
        </div>

        {currentFolder === null && (
          <section className="folders-section">
            <h3>폴더</h3>
            <div className="folder-grid">
              {folders.map((name) => (
                <div
                  key={name}
                  className="folder-card"
                  onClick={() => setCurrentFolder(name)}
                >
                  <div
                    className="folder-icon"
                    style={{
                      background: (folderColors[name] ?? '#7c3aed') + '30',
                      color: folderColors[name] ?? '#7c3aed',
                    }}
                  >
                    <Folder size={32} />
                  </div>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="recent-section">
          <h3>{currentFolder ? `${currentFolder} 파일` : '루트 파일'}</h3>
          {visibleFiles.length === 0 ? (
            <p className="empty-msg">파일이 없습니다.</p>
          ) : (
            <div className="file-list">
              {visibleFiles.map((f) => (
                <div key={f.id} className="file-row">
                  <span className="file-icon">{getFileIcon(f.type)}</span>
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">{(f.size / 1024).toFixed(0)} KB</span>
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
