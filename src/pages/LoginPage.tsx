import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react'
import { supabase, nimToEmail } from '../lib/supabase'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

const loginSchema = z.object({
  nim: z.string().min(5, 'NIM minimal 5 karakter').max(20, 'NIM maksimal 20 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginForm = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    const email = nimToEmail(data.nim)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    })

    if (error) {
      toast.error('NIM atau password salah')
      setLoading(false)
      return
    }

    if (authData.user) {
      // Fetch role to redirect properly
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      toast.success('Berhasil masuk!')
      if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
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

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card shadow-lg">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="Logo" className="h-16 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Selamat Datang</h1>
              <p className="text-gray-500 text-sm mt-1">Masuk ke akun Sertifikasi Algoritma Budi Luhur</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="nim" className="label">Nomor Induk Mahasiswa (NIM)</label>
                <input
                  id="nim"
                  type="text"
                  placeholder="Contoh: 123456789"
                  className="input-field"
                  {...register('nim')}
                />
                {errors.nim && (
                  <p className="text-red-500 text-xs mt-1">{errors.nim.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    className="input-field pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                id="btn-login"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Login menggunakan NIM dan password yang sudah terdaftar
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
