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
  // If it's still null, we shouldn't spin forever. We either show a failed state or redirect.
  // Since loading is false here, it means profile fetching finished or failed.
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <p className="text-red-500 font-semibold mb-2">Gagal memuat profil pengguna.</p>
        <p className="text-gray-500 text-sm mb-4">Silakan muat ulang halaman atau coba login kembali.</p>
        <button onClick={() => window.location.href = '/login'} className="btn-primary">
          Kembali ke Login
        </button>
      </div>
    )
  }

  // Wrong role → redirect to correct home
  if (role && profile.role !== role) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
