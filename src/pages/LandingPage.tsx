import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  ArrowRight,
  Calendar,
  Award,
  ShieldCheck,
  TrendingUp,
  Star,
  Users,
  BookOpen,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePrograms } from '../hooks/usePrograms'
import type { Program } from '../types'
import { CardSkeleton } from '../components/Skeleton'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import footerr from '../assets/footerr.png';
import heroBg from '../assets/hero-bg.png'

// Externalized helpers
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

// Memoized feature component
const FeatureCard = React.memo(({ feature }: { feature: any }) => {
  const Icon = feature.icon
  return (
    <div className="card hover:shadow-lg transition-all duration-300 group">
      <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
    </div>
  )
})
FeatureCard.displayName = 'FeatureCard'

const LandingPage: React.FC = () => {
  const { programs, loading } = usePrograms()
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const handleRegister = (programId: string) => {
    if (!user) {
      toast('Silakan login terlebih dahulu', { icon: '🔐' })
      navigate('/login')
      return
    }
    navigate('/dashboard', { state: { registerProgramId: programId } })
  }

  const features = useMemo(() => [
    {
      icon: Award,
      title: 'Sertifikat Resmi',
      description: 'Sertifikat dikeluarkan langsung oleh lembaga kampus yang diakui secara resmi.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: ShieldCheck,
      title: 'Terverifikasi',
      description: 'Setiap pendaftaran diverifikasi oleh tim admin kampus sebelum disetujui.',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Mendukung Karir',
      description: 'Tingkatkan nilai jual dirimu di dunia kerja dengan sertifikasi resmi kampus.',
      color: 'bg-purple-50 text-purple-600',
    },
  ], [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative min-h-[600px] flex items-center overflow-hidden bg-slate-900"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.5)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10 w-full text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fade-in backdrop-blur-md border" style={{ background: 'rgba(13,34,104,0.3)', color: '#7ea6ff', borderColor: 'rgba(13,34,104,0.5)' }}>
              <Star className="w-3.5 h-3.5" />
              Platform Sertifikasi Terpercaya
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-slide-up">
              Raih Sertifikat{' '}
              <span style={{ color: '#3d85ebff' }}>Resmi Kampus</span>{' '}
              dengan Mudah
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Daftarkan dirimu dalam program sertifikasi kampus dan tingkatkan kompetensimu.
              Proses mudah, cepat, dan terverifikasi secara resmi.
            </p>
            <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <a
                href="#programs"
                className="btn-primary text-base px-6 py-3"
              >
                Lihat Program <ChevronRight className="w-4 h-4" />
              </a>
              <Link
                to="/programs"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md font-medium rounded-lg text-base px-6 py-3 transition-all flex items-center gap-2"
              >
                Lihat Semua Sertifikasi
              </Link>
              {!user && (
                <>
                  <Link to="/login" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md font-medium rounded-lg text-base px-6 py-3 transition-all">
                    Masuk
                  </Link>
                  <Link to="/register" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md font-medium rounded-lg text-base px-6 py-3 transition-all">
                    Daftar Sekarang
                  </Link>
                </>
              )}
              {user && profile?.role === 'student' && (
                <Link to="/dashboard" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md font-medium rounded-lg text-base px-6 py-3 transition-all flex items-center gap-2">
                  <LayoutDashboardIcon /> Ke Dashboard
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div>
                <p className="text-2xl font-bold text-white">{programs.length}+</p>
                <p className="text-sm text-slate-400">Program Aktif</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-sm text-slate-400">Terverifikasi</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">Resmi</p>
                <p className="text-sm text-slate-400">Diakui Kampus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Program Tersedia</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Pilih Program Sertifikasimu
            </h2>
            <p className="text-gray-500">
              Temukan program yang sesuai dengan minat dan keahlianmu
            </p>
          </div>

          {loading && programs.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20 card">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Belum ada program tersedia</p>
              <p className="text-gray-400 text-sm mt-1">Program akan segera ditambahkan oleh admin</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                >
                  <div className="flex-1">
                    {program.image_url ? (
                      <div className="h-48 mb-5 overflow-hidden rounded-t-xl -mt-6 -mx-6">
                        <img
                          src={program.image_url}
                          alt={program.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight line-clamp-1">
                      {program.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="flex flex-col gap-2 text-gray-400 text-xs mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(program.date)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-700">📍 {program.venue}</span>
                        </div>
                        <div className="font-bold text-blue-600 text-sm">
                          {program.price === 0 ? 'Gratis' : formatPrice(program.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProgram(program)}
                    className="btn-primary w-full justify-center mt-auto"
                  >
                    Lihat Detail <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Detail Sertifikasi
              </h2>
              <button
                onClick={() => setSelectedProgram(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {selectedProgram.image_url && (
                <div className="w-full h-64 md:h-80 mb-6 rounded-2xl overflow-hidden shadow-sm">
                  <img src={selectedProgram.image_url} alt={selectedProgram.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="mb-6">
                {!selectedProgram.image_url && (
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProgram.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                  {selectedProgram.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Tanggal Pelaksanaan</p>
                    <p className="text-gray-900 font-semibold">{formatDate(selectedProgram.date)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5 text-xl leading-none">📍</div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Tempat / Venue</p>
                    <p className="text-gray-900 font-semibold">{selectedProgram.venue}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5 text-xl leading-none">⏳</div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Batas Daftar</p>
                    <p className="text-gray-900 font-semibold">{selectedProgram.registration_deadline ? formatDate(selectedProgram.registration_deadline) : '-'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Kuota Pendaftar</p>
                    <p className="text-gray-900 font-semibold">
                      {selectedProgram.registered_count || 0} / {selectedProgram.quota || 0} Terdaftar
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3 md:col-span-2">
                  <div className="w-5 h-5 text-blue-600 mt-0.5 flex items-center justify-center">
                    <span className="font-bold text-lg">💰</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Biaya Pendaftaran</p>
                    <p className="text-gray-900 font-bold text-lg">
                      {selectedProgram.price === 0 ? 'Gratis' : formatPrice(selectedProgram.price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="btn-secondary px-6"
                >
                  Kembali
                </button>
                <button
                  onClick={() => {
                    handleRegister(selectedProgram.id)
                  }}
                  className="btn-primary px-8"
                >
                  Daftar Sekarang <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Platform kami dirancang untuk memudahkan mahasiswa dalam mengakses program sertifikasi kampus
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl p-10 text-center relative overflow-hidden" style={{ background: '#00255a' }}>
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" strokeWidth="0.1" />
                </svg>
              </div>

              <Users className="w-12 h-12 text-blue-200 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Siap Memulai?
              </h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto">
                Bergabung sekarang dan daftarkan dirimu dalam program sertifikasi kampus
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/register"
                  className="font-semibold rounded-lg px-6 py-3 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                  style={{ background: '#fff', color: '#00255a' }}
                >
                  Daftar Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="font-medium rounded-lg px-6 py-3 transition-all active:scale-95 border text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Sudah Punya Akun? Masuk
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: '#00255a' }}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Logo + Social */}
            <div className="flex flex-col gap-1">
              <div>
                <img src={footerr} alt="footerr" className="h-32 object-contain" />
              </div>
              <div className="flex gap-2">
                {/* Email */}
                <a href="mailto:info@budiluhur.ac.id" aria-label="Email"
                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                </a>
                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook"
                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram"
                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                {/* YouTube */}
                <a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube"
                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /></svg>
                </a>
                {/* LinkedIn */}
                <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn"
                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold text-base mb-4">Quick Links</h4>
              <ul className="flex flex-col gap-2">
                {[
                  { label: 'Admission Website', href: 'https://pmb.budiluhur.ac.id' },
                  { label: 'Tracer Study', href: '#' },
                  { label: 'Alumni', href: '#' },
                  { label: 'Career Center', href: '#' },
                  { label: 'News & Updates', href: '#' },
                ].map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener"
                      className="text-sm transition-colors"
                      style={{ color: 'rgba(255,255,255,0.75)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: About */}
            <div>
              <h4 className="text-white font-bold text-base mb-4">About</h4>
              <ul className="flex flex-col gap-2">
                {[
                  { label: 'About Us', href: '#' },
                  { label: 'Facilities', href: '#' },
                  { label: 'Partnership', href: '#' },
                ].map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'rgba(255,255,255,0.75)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Location */}
            <div>
              <h4 className="text-white font-bold text-base mb-4">Location</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Jl. Ciledug Raya, RT 10/RW 2,<br />
                North Petukangan, Pesanggrahan<br />
                District, South Jakarta City,<br />
                Special Capital Region of Jakarta<br />
                12260
              </p>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div style={{ background: '#feef00' }} className="py-3 px-8">
          <p className="text-sm text-center" style={{ color: '#00255a' }}>
            Hak cipta &copy; 2026 Yayasan Pendidikan Budi Luhur Cakti
          </p>
        </div>
      </footer>
    </div>
  )
}

const LayoutDashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default LandingPage
