import { useState } from 'react'
import { Folder, FileText, Image, Upload, ChevronRight } from 'lucide-react'
import './drive.css'

const folders = [
  { name: 'Design Assets', color: '#7c3aed' },
  { name: 'Documents', color: '#3b82f6' },
  { name: 'Projects', color: '#22c55e' },
  { name: 'Shared', color: '#ec4899' },
]

const recentFiles = [
  { name: 'Project_Brief_v3.pdf', type: 'pdf', time: '2 hours ago' },
  { name: 'Dashboard_Mockup.png', type: 'image', time: '5 hours ago' },
  { name: 'Meeting_Notes.docx', type: 'doc', time: '1 day ago' },
]

export function Drive() {
  const [currentPath, setCurrentPath] = useState<string[]>([])

  return (
    <div className="drive-page">
      <header className="drive-header">
        <h1>파일 드라이브</h1>
        <button className="upload-btn glass">
          <Upload size={18} />
          업로드
        </button>
      </header>

      <div className="drive-content glass">
        {currentPath.length > 0 && (
          <div className="breadcrumb">
            <button onClick={() => setCurrentPath([])}>드라이브</button>
            {currentPath.map((p, i) => (
              <span key={i}>
                <ChevronRight size={14} />
                <button onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}>{p}</button>
              </span>
            ))}
          </div>
        )}

        <section className="folders-section">
          <h3>폴더</h3>
          <div className="folder-grid">
            {folders.map((f) => (
              <div
                key={f.name}
                className="folder-card"
                onClick={() => setCurrentPath([...currentPath, f.name])}
              >
                <div className="folder-icon" style={{ background: f.color + '30', color: f.color }}>
                  <Folder size={32} />
                </div>
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="recent-section">
          <h3>최근 파일</h3>
          <div className="file-list">
            {recentFiles.map((f) => (
              <div key={f.name} className="file-row">
                <span className="file-icon">
                  {f.type === 'pdf' ? <FileText size={20} /> : f.type === 'image' ? <Image size={20} /> : <FileText size={20} />}
                </span>
                <span className="file-name">{f.name}</span>
                <span className="file-time">{f.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
