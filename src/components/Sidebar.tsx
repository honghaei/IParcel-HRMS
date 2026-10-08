import type { FC } from 'react'
import {
  FaBullhorn,
  FaBuilding,
  FaCalendarCheck,
  FaChartBar,
  FaCog,
  FaHome,
  FaSignOutAlt,
  FaUmbrellaBeach,
  FaUsers,
} from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

type SidebarProps = {
  handleLogout: () => void
}

const navItems = [
  { path: '/home', label: 'Home', icon: FaHome },
  { path: '/dashboard', label: 'Employees', icon: FaUsers },
  { path: '/attendance', label: 'Attendance', icon: FaCalendarCheck },
  { path: '/leave-requests', label: 'Leave Requests', icon: FaUmbrellaBeach },
  { path: '/departments', label: 'Departments', icon: FaBuilding },
  { path: '/announcements', label: 'Announcements', icon: FaBullhorn },
  { path: '/reports', label: 'Reports', icon: FaChartBar },
  { path: '/settings', label: 'Settings', icon: FaCog },
]

const Sidebar: FC<SidebarProps> = ({ handleLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const go = (path: string) => navigate(path)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-avatar"><span>IP</span><b>+</b></div>
        <div>
          <strong>IParcel HRMS</strong>
          <small>Employee Management</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section">WORKSPACE</span>

        {navItems.map(item => {
          const Icon = item.icon
          const active = location.pathname.endsWith(item.path)

          return (
            <button
              key={item.path}
              className={`nav-link ${active ? 'active' : ''}`}
              onClick={() => go(item.path)}
            >
              <span className="nav-icon"><Icon /></span>
              <span className="nav-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span className="nav-icon logout-icon"><FaSignOutAlt/></span>
        <span className="nav-label">Sign out</span>
      </button>
    </aside>
  )
}

export default Sidebar
