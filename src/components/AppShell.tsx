import type { ReactNode } from 'react'
import { FaBell, FaSearch } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import type { LoggedInUser } from '../types/hr'

export default function AppShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  let user: LoggedInUser | null = null
  try {
    const raw = localStorage.getItem('user')
    if (raw) user = JSON.parse(raw)
  } catch {
    user = null
  }

  const logout = () => {
    localStorage.removeItem('user')
    navigate('/')
  }

  const globalSearch = (value: string) => {
    const search = value.trim()
    if (search) navigate(`/dashboard?q=${encodeURIComponent(search)}`)
  }

  return (
    <div className="app-shell">
      <Sidebar handleLogout={logout}/>
      <main className="main-area">
        <header className="topbar enhanced-topbar">
          <div className="topbar-title enhanced-page-identity">
            <span className="page-identity-accent" aria-hidden="true"/>
            <div className="page-identity-copy">
              <span className="eyebrow">{eyebrow}</span>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="topbar-center">
            <FaSearch/>
            <input
              placeholder="Search employees..."
              onKeyDown={event => {
                if (event.key === 'Enter') globalSearch(event.currentTarget.value)
              }}
            />
          </div>
          <div className="topbar-actions">
            <button className="notification-button" aria-label="Notifications"><FaBell/></button>
            <div className="top-user"><span>{user?.name?.slice(0,1).toUpperCase() || 'H'}</span><div><strong>{user?.name || 'HR User'}</strong><small>{user?.role || 'HR'}</small></div></div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}
