import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

export default function Notifications() {
  const { liveNotifications } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchNotifications()
  }, [page])

  // add live notifications to top
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
    setLoading(true)
    try {
      const res = await api.get('/notifications', { params: { page, limit: 15 } })
      setNotifications(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.log(err)
    }
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read)
    for (const n of unread) {
      await markRead(n._id)
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} mins ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hours ago`
    return `${Math.floor(hrs / 24)} days ago`
  }

  const typeLabels = {
    lead_created: '[NEW]',
    lead_assigned: '[ASSIGNED]',
    lead_status_changed: '[STATUS]',
    lead_deleted: '[DELETED]'
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Notifications ({pagination.total})</h1>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">No notifications yet</div>
      ) : (
        <>
          {notifications.map(n => (
            <div
              key={n._id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                background: n.read ? 'white' : '#fff8f8',
                borderLeft: n.read ? 'none' : '4px solid #e94560',
                cursor: !n.read ? 'pointer' : 'default'
              }}
              onClick={() => !n.read && markRead(n._id)}
            >
              <span style={{ fontSize: '13px', color: '#999', flexShrink: 0, paddingTop: '2px' }}>
                {typeLabels[n.type] || '[INFO]'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px' }}>{n.message}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && (
                <span style={{ background: '#e94560', color: 'white', borderRadius: '50%', width: '8px', height: '8px', flexShrink: 0, marginTop: '6px' }} />
              )}
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</button>
              <span style={{ padding: '6px 12px', fontSize: '14px' }}>{page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
