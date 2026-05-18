import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  LogOut,
  Download,
  Settings,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AvatarImage from './AvatarImage'
import toast from 'react-hot-toast'
import logo from '../assets/logo.webp'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Program', icon: BookOpen, path: '/admin/programs' },
  { label: 'Verifikasi', icon: ClipboardList, path: '/admin/registrations' },
  { label: 'Export', icon: Download, path: '/admin/export' },
  { label: 'Pengaturan', icon: Settings, path: '/profile' },
]

const AdminSidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/')
  }

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">SertifikasiKampus</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${active ? 'text-blue-600' : 'text-gray-400'}`} style={{ width: '18px', height: '18px' }} />
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-gray-100">
        {profile && (
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2.5">
              <AvatarImage src={profile.avatar_url} name={profile.name} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.name}</p>
                <p className="text-xs text-gray-400">NIM: {profile.nim}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

export default React.memo(AdminSidebar)
