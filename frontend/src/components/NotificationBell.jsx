import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

export default function NotificationBell() {
  const { liveNotifications, unreadCount, setUnreadCount } = useSocket()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  // merge live notifications
  useEffect(() => {
    if (liveNotifications.length > 0) {
      setNotifications(prev => {
        const ids = new Set(prev.map(n => n._id))
        const newOnes = liveNotifications.filter(n => !ids.has(n._id))
        return [...newOnes, ...prev]
      })
    }
  }, [liveNotifications])

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications?limit=10')
      setNotifications(res.data.data)
      const unread = res.data.data.filter(n => !n.read).length
      setUnreadCount(unread)
    } catch (err) {
      console.log('Error fetching notifications:', err)
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.log(err)
    }
  }

  // close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div className="notif-bell" onClick={() => setOpen(!open)}>
        <span>&#128276;</span>
        {unreadCount > 0 && (
          <span className="badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </div>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
              No notifications
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={() => !n.read && markRead(n._id)}
              >
                <div>{n.message}</div>
                <div className="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
