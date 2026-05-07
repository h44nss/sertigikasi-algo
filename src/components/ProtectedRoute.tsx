import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: 'admin' | 'student'
}

const Spinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Memuat...</p>
    </div>
  </div>
)

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, profile, loading } = useAuth()

  // Still resolving auth state
  if (loading) return <Spinner />

  // Not authenticated → go to login
  if (!user) return <Navigate to="/login" replace />

  // FIX: user is authenticated but profile hasn't loaded yet (e.g. slow DB or fetch error).
  // Show spinner briefly instead of rendering children without role protection.
  if (!profile) return <Spinner />

  // Wrong role → redirect to correct home
  if (role && profile.role !== role) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
