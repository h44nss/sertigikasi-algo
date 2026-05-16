import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard, FileText, User, ChevronDown } from 'lucide-react'
import logo from '../assets/logo.png'
import { useAuth } from '../contexts/AuthContext'
import AvatarImage from './AvatarImage'
import toast from 'react-hot-toast'

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleSignOut = useCallback(async () => {
    setDropdownOpen(false)
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/')
  }, [signOut, navigate])

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname])

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Logo Budi Luhur" className="w-10 h-10 object-contain" />
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 text-sm leading-none block">Budi Luhur</span>
              <span className="text-xs text-gray-400 leading-none">Sertifikasi Algoritma</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Beranda
            </Link>
            <Link
              to="/programs"
              className={`text-sm font-medium transition-colors ${isActive('/programs') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Sertifikasi
            </Link>

            {user && profile?.role === 'student' && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-registrations"
                  className={`text-sm font-medium transition-colors ${isActive('/my-registrations') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Pendaftaran Saya
                </Link>
              </>
            )}

            {user && profile?.role === 'admin' && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${isActive('/admin') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user && profile ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                >
                  <AvatarImage src={profile.avatar_url} name={profile.name} size="sm" />
                  <span className="text-sm font-medium text-gray-700">{profile.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs text-gray-400">NIM</p>
                      <p className="text-sm font-semibold text-gray-900">{profile.nim}</p>
                    </div>
                    {profile.role === 'student' && (
                      <>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link
                          to="/my-registrations"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FileText className="w-4 h-4" /> Pendaftaran Saya
                        </Link>
                      </>
                    )}
                    {profile.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" /> Pengaturan Profil
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">
                  Masuk
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Beranda
              </Link>
              <Link
                to="/programs"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Sertifikasi
              </Link>

              {user && profile?.role === 'student' && (
                <>
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-registrations"
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pendaftaran Saya
                  </Link>
                </>
              )}

              {user && profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}

              {user && (
                <Link
                  to="/profile"
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4" /> Pengaturan Profil
                </Link>
              )}

              {user ? (
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Link to="/login" className="btn-secondary flex-1 justify-center text-sm" onClick={() => setMenuOpen(false)}>
                    Masuk
                  </Link>
                  <Link to="/register" className="btn-primary flex-1 justify-center text-sm" onClick={() => setMenuOpen(false)}>
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default React.memo(Navbar)
