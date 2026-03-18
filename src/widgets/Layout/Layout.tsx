import { Home, MessageSquare, Calendar, RotateCw, FolderUp, Bot, Users, Settings, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../../features/auth/model'
import logoImg from '../../assets/logo.png'
import './Layout.css'

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/chat', icon: MessageSquare, label: '채팅' },
  { to: '/calendar', icon: Calendar, label: '캘린더' },
  { to: '/members', icon: Users, label: '멤버' },
  { to: '/attendance', icon: RotateCw, label: '출퇴근' },
  { to: '/drive', icon: FolderUp, label: '드라이브' },
  { to: '/ai', icon: Bot, label: 'AI' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export function Layout() {
  const navigate = useNavigate()
  const { state, logout } = useApp()
  const { currentUser } = state

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <img src={logoImg} alt="yANUs" className="logo-img" />
        </div>
        <nav className="nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={label}
            >
              <Icon size={22} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        {currentUser && (
          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {currentUser.name.charAt(0)}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.name}</span>
                <span className="sidebar-user-role">{currentUser.role}</span>
              </div>
            </div>
            <button className="sidebar-auth-btn logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          </div>
        )}
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
