import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Mail, CreditCard, Save, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import AdminSidebar from '../components/AdminSidebar'

const profileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter'),
})

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Password minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
    }
  })

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onUpdateProfile = async (data: ProfileForm) => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: data.name })
        .eq('id', user.id)

      if (error) throw error
      
      await refreshProfile()
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error('Gagal memperbarui profil')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onChangePassword = async (data: PasswordForm) => {
    setPassLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) throw error
      
      toast.success('Password berhasil diperbarui')
      resetPass()
    } catch (err) {
      toast.error('Gagal memperbarui password')
      console.error(err)
    } finally {
      setPassLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className={`min-h-screen bg-gray-50 ${isAdmin ? 'flex' : ''}`}>
      {isAdmin ? <AdminSidebar /> : <Navbar />}
      
      <main className={`flex-1 ${isAdmin ? 'ml-64 p-8' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'}`}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola informasi akun dan keamanan Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="card text-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.role === 'admin' ? 'Administrator' : `Mahasiswa (${profile?.nim})`}</p>
              
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </div>
                {profile?.role === 'student' && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                    NIM: {profile.nim}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Shield className="w-3.5 h-3.5" />
                  Role: {profile?.role?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="md:col-span-2 space-y-8">
            {/* General Profile */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Informasi Dasar</h3>
              </div>

              <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
                <div>
                  <label className="label">Nama Lengkap</label>
                  <input
                    {...register('name')}
                    className="input-field"
                    placeholder="Nama Anda"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">NIM (Tidak dapat diubah)</label>
                  <input
                    value={profile?.nim || ''}
                    disabled
                    className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Keamanan & Password</h3>
              </div>

              <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4">
                <div>
                  <label className="label">Password Baru</label>
                  <input
                    type="password"
                    {...regPass('newPassword')}
                    className="input-field"
                    placeholder="Minimal 6 karakter"
                  />
                  {passErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{passErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    {...regPass('confirmPassword')}
                    className="input-field"
                    placeholder="Ulangi password baru"
                  />
                  {passErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{passErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="btn-danger"
                  >
                    {passLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memperbarui...
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Perbarui Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
