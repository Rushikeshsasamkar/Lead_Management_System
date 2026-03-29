import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [liveNotifications, setLiveNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    })

    s.on('connect', () => console.log('Socket connected'))
    s.on('notification', (notif) => {
      setLiveNotifications(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)
    })
    s.on('connect_error', (err) => console.log('Socket error:', err.message))

    setSocket(s)
    return () => s.disconnect()
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, liveNotifications, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
