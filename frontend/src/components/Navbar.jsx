import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="navbar">
      <Link to="/" className="brand">CRM+</Link>
      <nav>
        <Link to="/">Leads</Link>
        {hasPermission('dashboard:read') && <Link to="/dashboard">Dashboard</Link>}
        <Link to="/notifications">Notifications</Link>
      </nav>
      <div className="user-info">
        <NotificationBell />
        <span>{user.name}</span>
        <span className="role-badge">{user.role}</span>
        <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}
