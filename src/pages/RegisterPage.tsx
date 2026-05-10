import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Eye, EyeOff, UserPlus } from 'lucide-react'
import { supabase, nimToEmail } from '../lib/supabase'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

const registerSchema = z.object({
  nim: z.string().min(5, 'NIM minimal 5 karakter').max(20, 'NIM maksimal 20 karakter'),
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama terlalu panjang'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    const email = nimToEmail(data.nim)

    // Check if NIM already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nim', data.nim)
      .single()

    if (existing) {
      toast.error('NIM sudah terdaftar')
      setLoading(false)
      return
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          nim: data.nim,
        },
      },
    })

    if (authError) {
      toast.error(authError.message || 'Gagal membuat akun')
      setLoading(false)
      return
    }

    if (authData.user) {
      // Insert into users table
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        nim: data.nim,
        name: data.name,
        role: 'student',
      })

      if (profileError) {
        toast.error('Gagal menyimpan data profil')
        setLoading(false)
        return
      }

      toast.success('Akun berhasil dibuat! Selamat datang.')
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm">
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-gray-900">SertifikasiKampus</span>
        </Link>
      </div>

      {/* Register Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="card shadow-lg">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Buat Akun</h1>
              <p className="text-gray-500 text-sm mt-1">Daftar sebagai mahasiswa</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="reg-nim" className="label">NIM</label>
                <input
                  id="reg-nim"
                  type="text"
                  placeholder="Nomor Induk Mahasiswa"
                  className="input-field"
                  {...register('nim')}
                />
                {errors.nim && <p className="text-red-500 text-xs mt-1">{errors.nim.message}</p>}
              </div>

              <div>
                <label htmlFor="reg-name" className="label">Nama Lengkap</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Nama lengkap sesuai KTM"
                  className="input-field"
                  {...register('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="reg-password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Buat password (min. 6 karakter)"
                    className="input-field pr-10"
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="reg-confirm" className="label">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Ulangi password"
                    className="input-field pr-10"
                    {...register('confirmPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                id="btn-register"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mendaftar...
                  </span>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
