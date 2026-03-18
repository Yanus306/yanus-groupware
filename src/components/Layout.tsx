import { Home, MessageSquare, Calendar, RotateCw, FolderUp, Bot, Users, Settings, LogOut, LogIn, UserPlus } from 'lucide-react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import logoImg from '../assets/logo.png'
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
  const { state, isLoggedIn, logout } = useApp()

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
        <div className="sidebar-bottom">
          {isLoggedIn ? (
            <>
              <div className="sidebar-user">
                <span className="sidebar-user-avatar">{state.currentUser.name[0]}</span>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{state.currentUser.name}</span>
                  <span className="sidebar-user-role">{state.currentUser.team}</span>
                </div>
              </div>
              <button className="sidebar-auth-btn logout-btn" onClick={logout} title="로그아웃">
                <LogOut size={16} />
                <span>로그아웃</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="sidebar-auth-btn">
                <LogIn size={16} />
                <span>로그인</span>
              </Link>
              <Link to="/signup" className="sidebar-auth-btn">
                <UserPlus size={16} />
                <span>회원가입</span>
              </Link>
            </>
          )}
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
