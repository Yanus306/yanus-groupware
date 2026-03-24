import { Home, MessageSquare, Calendar, RotateCw, FolderUp, Bot, Users, Settings, LogOut, ShieldCheck, Sun, Moon, ArrowLeftRight } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../features/auth/model'
import { useTheme } from '../../shared/theme'
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
  const location = useLocation()
  const navigate = useNavigate()
  const { state, isAdmin, isTeamLead, logout } = useApp()
  const { theme, toggleTheme } = useTheme()
  const { currentUser } = state
  const visibleNavItems = [
    ...navItems,
    ...(isTeamLead ? [{ to: '/team-management', icon: ArrowLeftRight, label: '팀 관리' }] : []),
  ]
  const currentNav = visibleNavItems.find(({ to }) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)))
  const pageTitle = location.pathname === '/admin' ? '관리자' : currentNav?.label ?? '홈'
  const themeLabel = theme === 'dark' ? '라이트 모드' : '다크 모드'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo-panel">
          <div className="logo">
            <img src={logoImg} alt="yANUs" className="logo-img" />
            <div className="logo-copy">
              <strong>yANUs Groupware</strong>
            </div>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav className="nav">
          {visibleNavItems.map(({ to, icon: Icon, label }) => (
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
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item admin-nav-item ${isActive ? 'active' : ''}`}
              title="관리자"
            >
              <ShieldCheck size={22} />
              <span className="nav-label">관리자</span>
            </NavLink>
          )}
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
        <header className="content-topbar">
          <div>
            <p className="content-kicker">Workspace</p>
            <h1>{pageTitle}</h1>
          </div>
        </header>
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
