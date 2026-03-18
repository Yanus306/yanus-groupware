import { Home, MessageSquare, Calendar, RotateCw, FolderUp, Bot, Users, Settings, LogIn, UserPlus } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
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
  const [isLoggedIn] = useState(() => !!localStorage.getItem('accessToken'))

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
        {!isLoggedIn && (
          <div className="sidebar-auth">
            <button className="sidebar-auth-btn login" onClick={() => navigate('/login')}>
              <LogIn size={16} />
              <span>로그인</span>
            </button>
            <button className="sidebar-auth-btn register" onClick={() => navigate('/register')}>
              <UserPlus size={16} />
              <span>회원가입</span>
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
