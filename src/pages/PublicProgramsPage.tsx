import React, { useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Calendar, ArrowRight, X, ChevronLeft, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import { usePrograms } from '../hooks/usePrograms'
import { useAuth } from '../contexts/AuthContext'
import type { Program } from '../types'
import { CardSkeleton } from '../components/Skeleton'
import toast from 'react-hot-toast'

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

// Memoized Card for Public List
const PublicProgramCard = React.memo(({ program, onSelect }: { program: Program, onSelect: (p: Program) => void }) => (
  <div
    className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
  >
    <div className="flex-1">
      {program.image_url ? (
        <div className="h-48 mb-5 overflow-hidden rounded-t-xl -mt-6 -mx-6 bg-gray-100">
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
          <span className="font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-700">📍 {program.venue}</span>
          <span className="font-bold text-blue-600 text-sm">
            {program.price === 0 ? 'Gratis' : formatPrice(program.price)}
          </span>
        </div>
      </div>
    </div>
    <button
      onClick={() => onSelect(program)}
      className="btn-primary w-full justify-center mt-auto"
    >
      Lihat Detail <ArrowRight className="w-4 h-4" />
    </button>
  </div>
))
PublicProgramCard.displayName = 'PublicProgramCard'

const PublicProgramsPage: React.FC = () => {
  const { programs, loading } = usePrograms()
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleRegister = useCallback((programId: string) => {
    if (!user) {
      toast('Silakan login terlebih dahulu', { icon: '🔐' })
      navigate('/login')
      return
    }
    navigate('/dashboard', { state: { registerProgramId: programId } })
  }, [user, navigate])

  const handleSelect = useCallback((p: Program) => setSelectedProgram(p), [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Semua Sertifikasi</h1>
            </div>
            <p className="text-gray-500 text-lg">
              Jelajahi semua program sertifikasi kampus yang tersedia
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20 card mt-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Belum ada program tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {programs.map((program) => (
                <PublicProgramCard 
                  key={program.id} 
                  program={program} 
                  onSelect={handleSelect} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                <div className="w-full h-64 md:h-80 mb-6 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                  <img src={selectedProgram.image_url} alt={selectedProgram.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="mb-6">
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
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3 md:col-span-2">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Kuota & Biaya</p>
                    <p className="text-gray-900 font-bold">
                      {selectedProgram.registered_count || 0} / {selectedProgram.quota || 0} Terdaftar · {selectedProgram.price === 0 ? 'Gratis' : formatPrice(selectedProgram.price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 flex gap-3 justify-end sticky bottom-0 bg-white">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="btn-secondary px-6"
                >
                  Kembali
                </button>
                <button
                  onClick={() => handleRegister(selectedProgram.id)}
                  className="btn-primary px-8"
                >
                  Daftar Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProgramsPage
