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
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fade-in backdrop-blur-md border border-blue-500/30">
              <Star className="w-3.5 h-3.5" />
              Platform Sertifikasi Terpercaya
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-slide-up">
              Raih Sertifikat{' '}
              <span className="text-blue-500">Resmi Kampus</span>{' '}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
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
            <div className="bg-blue-600 rounded-2xl p-10 text-center relative overflow-hidden">
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
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-lg px-6 py-3 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  Daftar Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="border border-blue-400 text-white hover:bg-blue-700 font-medium rounded-lg px-6 py-3 transition-colors active:scale-95 transition-all"
                >
                  Sudah Punya Akun? Masuk
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">SertifikasiKampus</span>
            </div>
            <p className="text-gray-400 text-sm">© 2026 SertifikasiKampus. Hak cipta dilindungi.</p>
          </div>
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
