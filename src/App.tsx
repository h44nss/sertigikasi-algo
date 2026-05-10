import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const PublicProgramsPage = lazy(() => import('./pages/PublicProgramsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

// Student Pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const MyRegistrations = lazy(() => import('./pages/MyRegistrations'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ProgramsPage = lazy(() => import('./pages/admin/ProgramsPage'))
const RegistrationsPage = lazy(() => import('./pages/admin/RegistrationsPage'))
const ExportPage = lazy(() => import('./pages/admin/ExportPage'))

// Profile Page
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

// Redirect logged-in users away from auth pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) return <PageLoader />

  if (user && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/programs" element={<PublicProgramsPage />} />
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

        {/* Shared Protected */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
