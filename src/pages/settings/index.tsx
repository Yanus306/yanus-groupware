import './settings.css'

export function Settings() {
  return (
    <div className="settings-page">
      <h1>설정</h1>
      <div className="glass settings-card">
        <h3>일반</h3>
        <div className="setting-row">
          <span>알림</span>
          <input type="checkbox" defaultChecked />
        </div>
        <div className="setting-row">
          <span>다크 모드</span>
          <input type="checkbox" defaultChecked />
        </div>
      </div>
    </div>
  )
}
