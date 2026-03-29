import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import LeadsList from './pages/LeadsList'
import LeadForm from './pages/LeadForm'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><LeadsList /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/new" element={
              <ProtectedRoute>
                <Layout><LeadForm /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leads/:id/edit" element={
              <ProtectedRoute>
                <Layout><LeadForm /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute permission="dashboard:read">
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout><Notifications /></Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
