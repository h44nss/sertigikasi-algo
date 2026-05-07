import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Student Pages
import StudentDashboard from './pages/StudentDashboard'
import MyRegistrations from './pages/MyRegistrations'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ProgramsPage from './pages/admin/ProgramsPage'
import RegistrationsPage from './pages/admin/RegistrationsPage'
import ExportPage from './pages/admin/ExportPage'

// Redirect logged-in users away from auth pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()

  // FIX: Show spinner instead of null to avoid white flash during init
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

      {/* Student */}
      <Route path="/dashboard" element={
        <ProtectedRoute role="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/my-registrations" element={
        <ProtectedRoute role="student">
          <MyRegistrations />
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/programs" element={
        <ProtectedRoute role="admin">
          <ProgramsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/registrations" element={
        <ProtectedRoute role="admin">
          <RegistrationsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/export" element={
        <ProtectedRoute role="admin">
          <ExportPage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#111827',
              fontSize: '14px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              border: '1px solid #f3f4f6',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
