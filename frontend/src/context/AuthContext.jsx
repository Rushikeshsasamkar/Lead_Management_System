import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

const ROLE_PERMISSIONS = {
  admin: ['lead:read', 'lead:write', 'lead:delete', 'user:read', 'user:write', 'dashboard:read', 'notification:read'],
  manager: ['lead:read', 'lead:write', 'user:read', 'dashboard:read', 'notification:read'],
  sales: ['lead:read', 'lead:write', 'notification:read']
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  function login(token, userData) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  function hasPermission(permission) {
    if (!user) return false
    const perms = ROLE_PERMISSIONS[user.role] || []
    return perms.includes(permission)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
