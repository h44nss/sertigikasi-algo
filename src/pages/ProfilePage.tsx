import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Lock, Mail, CreditCard, Save, Shield,
  Camera, Upload, FileText, X, Eye, CheckCircle2,
} from 'lucide-react'
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
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const MAX_AVATAR_MB = 2
const MAX_KTM_MB = 5
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_KTM_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  // Avatar — local preview only, source of truth is profile.avatar_url
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // KTM — local state only (students)
  const [ktmUrl, setKtmUrl] = useState<string | null>(null)
  const [ktmPreview, setKtmPreview] = useState<string | null>(null)
  const [ktmFile, setKtmFile] = useState<File | null>(null)
  const [ktmUploading, setKtmUploading] = useState(false)
  const [ktmIsPdf, setKtmIsPdf] = useState(false)
  const [showKtmModal, setShowKtmModal] = useState(false)
  const ktmInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview) }
  }, [avatarPreview])

  useEffect(() => {
    return () => { if (ktmPreview) URL.revokeObjectURL(ktmPreview) }
  }, [ktmPreview])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile?.name || '' },
  })

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  // ── Avatar: pick file ────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Format foto hanya JPG, PNG, atau WebP')
      return
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Ukuran foto maksimal ${MAX_AVATAR_MB} MB`)
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // ── Avatar: upload → save URL to DB → refresh profile ────────────────────
  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return
    setAvatarUploading(true)
    try {
      const ext = avatarFile.name.split('.').pop()
      const filePath = `${user.id}/avatar.${ext}`

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })
      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      // Add cache-bust so browsers reload the image even if filename is same
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // 3. Save URL to database — this is the source of truth
      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
      if (dbError) throw dbError

      // 4. Refresh AuthContext profile → all UI updates automatically
      await refreshProfile()

      // Clear local preview state
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Foto profil berhasil diperbarui!')
    } catch (err) {
      toast.error('Gagal upload foto profil')
      console.error(err)
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── KTM: pick file ────────────────────────────────────────────────────────
  const handleKtmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_KTM_TYPES.includes(file.type)) {
      toast.error('Format KTM hanya JPG, PNG, WebP, atau PDF')
      return
    }
    if (file.size > MAX_KTM_MB * 1024 * 1024) {
      toast.error(`Ukuran KTM maksimal ${MAX_KTM_MB} MB`)
      return
    }
    setKtmFile(file)
    setKtmIsPdf(file.type === 'application/pdf')
    setKtmPreview(file.type !== 'application/pdf' ? URL.createObjectURL(file) : null)
  }

  // ── KTM: upload ────────────────────────────────────────────────────────────
  const handleKtmUpload = async () => {
    if (!ktmFile || !user) return
    setKtmUploading(true)
    try {
      const ext = ktmFile.name.split('.').pop()
      const filePath = `${user.id}/ktm.${ext}`

      const { error } = await supabase.storage
        .from('ktm-files')
        .upload(filePath, ktmFile, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('ktm-files').getPublicUrl(filePath)
      setKtmUrl(`${data.publicUrl}?t=${Date.now()}`)
      setKtmFile(null)
      setKtmPreview(null)
      toast.success('KTM berhasil diupload!')
    } catch (err) {
      toast.error('Gagal upload KTM')
      console.error(err)
    } finally {
      setKtmUploading(false)
    }
  }

  // ── Profile name update ────────────────────────────────────────────────────
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

  // ── Password update ────────────────────────────────────────────────────────
  const onChangePassword = async (data: PasswordForm) => {
    setPassLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
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
  const isStudent = profile?.role === 'student'

  // Display: local preview while picking, then fall back to profile.avatar_url (DB truth)
  const displayAvatar = avatarPreview || profile?.avatar_url || null

  return (
    <div className={`min-h-screen bg-gray-50 ${isAdmin ? 'flex' : ''}`}>
      {isAdmin ? <AdminSidebar /> : <Navbar />}

      {/* KTM Preview Modal */}
      {showKtmModal && ktmUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowKtmModal(false)}
        >
          <div
            className="relative max-w-2xl w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                KTM — {profile?.name}
              </h4>
              <button
                onClick={() => setShowKtmModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {ktmIsPdf ? (
                <iframe src={ktmUrl} title="KTM PDF" className="w-full h-96 rounded-lg border" />
              ) : (
                <img src={ktmUrl} alt="KTM" className="w-full rounded-lg object-contain max-h-[70vh]" />
              )}
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 ${isAdmin ? 'ml-64 p-8' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'}`}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola informasi akun dan keamanan Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Sidebar Info ── */}
          <div className="md:col-span-1 space-y-6">
            <div className="card text-center py-8">
              {/* Avatar */}
              <div className={`relative w-24 h-24 mx-auto mb-4 ${isStudent ? 'group' : ''}`}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-blue-100 flex items-center justify-center">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Foto Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-blue-400" />
                  )}
                </div>

                {/* Camera overlay — students only */}
                {isStudent && (
                  <>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      title="Ganti foto profil"
                    >
                      <Camera className="w-7 h-7 text-white" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>

              {/* Upload confirmation — students only, shown only when file picked */}
              {isStudent && avatarFile && (
                <div className="mb-4 space-y-2 px-4">
                  <p className="text-xs text-gray-500 truncate">{avatarFile.name}</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={avatarUploading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
                    >
                      {avatarUploading
                        ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Upload className="w-3 h-3" />}
                      {avatarUploading ? 'Upload...' : 'Simpan Foto'}
                    </button>
                  </div>
                </div>
              )}

              <h2 className="font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-sm text-gray-500">
                {profile?.role === 'admin' ? 'Administrator' : `Mahasiswa (${profile?.nim})`}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </div>
                {isStudent && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                    NIM: {profile?.nim}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Shield className="w-3.5 h-3.5" />
                  Role: {profile?.role?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* ── Forms ── */}
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
                  <input {...register('name')} className="input-field" placeholder="Nama Anda" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">NIM (Tidak dapat diubah)</label>
                  <input value={profile?.nim || ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      <><Save className="w-4 h-4" /> Simpan Perubahan</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* KTM Upload — students only */}
            {isStudent && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Kartu Tanda Mahasiswa (KTM)</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Format: JPG, PNG, WebP, atau PDF · Maks. {MAX_KTM_MB} MB</p>
                  </div>
                </div>

                {ktmUrl && !ktmFile && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      KTM sudah terupload
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowKtmModal(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat
                    </button>
                  </div>
                )}

                <div
                  onClick={() => ktmInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors group bg-gray-50 hover:bg-blue-50/40"
                >
                  <input
                    ref={ktmInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleKtmChange}
                  />
                  {ktmPreview ? (
                    <img src={ktmPreview} alt="Preview KTM" className="max-h-48 mx-auto rounded-lg object-contain" />
                  ) : ktmFile && ktmIsPdf ? (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <FileText className="w-12 h-12 text-red-400" />
                      <p className="text-sm font-medium">{ktmFile.name}</p>
                      <p className="text-xs text-gray-400">{(ktmFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <Upload className="w-10 h-10" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                          {ktmUrl ? 'Klik untuk mengganti KTM' : 'Klik untuk upload KTM'}
                        </p>
                        <p className="text-xs mt-1">JPG, PNG, WebP, atau PDF · maks. {MAX_KTM_MB} MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {ktmFile && (
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => { setKtmFile(null); setKtmPreview(null) }}
                      className="flex-1 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleKtmUpload}
                      disabled={ktmUploading}
                      className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {ktmUploading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Upload className="w-4 h-4" />}
                      {ktmUploading ? 'Mengupload...' : 'Upload KTM'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Change Password */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Keamanan &amp; Password</h3>
              </div>
              <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4">
                <div>
                  <label className="label">Password Baru</label>
                  <input type="password" {...regPass('newPassword')} className="input-field" placeholder="Minimal 6 karakter" />
                  {passErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passErrors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="label">Konfirmasi Password Baru</label>
                  <input type="password" {...regPass('confirmPassword')} className="input-field" placeholder="Ulangi password baru" />
                  {passErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passErrors.confirmPassword.message}</p>}
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={passLoading} className="btn-danger">
                    {passLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memperbarui...
                      </span>
                    ) : (
                      <><Lock className="w-4 h-4" /> Perbarui Password</>
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
