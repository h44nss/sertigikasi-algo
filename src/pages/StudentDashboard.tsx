import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Calendar,
  ClipboardList,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  X,
} from 'lucide-react'
import XenditSimulation from '../components/XenditSimulation'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePrograms } from '../hooks/usePrograms'
import { useRegistrations } from '../hooks/useRegistrations'
import type { Program } from '../types'
import { CardSkeleton, StatSkeleton } from '../components/Skeleton'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'

// Helper functions moved outside component
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

// Memoized Stat Component
const StatCard = React.memo(({ label, value, icon: Icon, color }: any) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
))

StatCard.displayName = 'StatCard'

const StudentDashboard: React.FC = () => {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isMounted = useRef(true)

  const { programs, loading: loadingPrograms } = usePrograms()
  const { registrations, loading: loadingRegs, refresh: refreshRegs } = useRegistrations()

  const [registering, setRegistering] = useState<string | null>(null)
  const [paymentProgram, setPaymentProgram] = useState<Program | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const loading = loadingPrograms || loadingRegs

  // Optimize registration lookup
  const registeredProgramIds = useMemo(() =>
    new Set(registrations.map(r => r.program_id)),
    [registrations]
  )

  const isRegistered = useCallback((programId: string) =>
    registeredProgramIds.has(programId),
    [registeredProgramIds]
  )

  // Memoized stats
  const stats = useMemo(() => [
    {
      label: 'Program Terdaftar',
      value: registrations.length,
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Disetujui',
      value: registrations.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Menunggu',
      value: registrations.filter((r) => r.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ], [registrations])

  // Handle direct registration from landing page
  useEffect(() => {
    if (location.state?.registerProgramId && programs.length > 0) {
      const program = programs.find(p => p.id === location.state.registerProgramId)
      if (program) {
        setSelectedProgram(program)
        navigate(location.pathname, { replace: true, state: {} })
      }
    }
  }, [location.state, programs, navigate, location.pathname])

  const executeRegistration = async (programId: string, paymentStatus: 'unpaid' | 'paid') => {
    if (!profile?.id) return
    setRegistering(programId)

    try {
      const { error } = await supabase.from('registrations').insert({
        user_id: profile.id,
        program_id: programId,
        status: 'pending',
        payment_status: paymentStatus,
      })

      if (error) throw error

      toast.success('Berhasil mendaftar program')
      await refreshRegs()
    } catch (err) {
      toast.error('Gagal mendaftar program')
      console.error(err)
    } finally {
      if (isMounted.current) setRegistering(null)
    }
  }

  const handleRegister = useCallback((program: Program) => {
    if (!profile) return
    if (isRegistered(program.id)) {
      toast('Kamu sudah mendaftar program ini', { icon: 'ℹ️' })
      return
    }

    if (program.price > 0) {
      setPaymentProgram(program)
      return
    }

    executeRegistration(program.id, 'paid')
  }, [profile, isRegistered])

  const handlePaymentSuccess = async () => {
    if (!paymentProgram) return
    await executeRegistration(paymentProgram.id, 'paid')
    if (isMounted.current) setPaymentProgram(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Halo, {profile?.name}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">NIM: {profile?.nim} · Dashboard Mahasiswa</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {loading && registrations.length === 0 ? (
            [1, 2, 3].map(i => <StatSkeleton key={i} />)
          ) : (
            stats.map((stat, i) => <StatCard key={i} {...stat} />)
          )}
        </div>

        {/* Recent Registrations */}
        {registrations.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pendaftaran Terbaru</h2>
              <Link to="/my-registrations" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {registrations.slice(0, 3).map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reg.program?.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(reg.created_at)}</p>
                    </div>
                  </div>
                  <StatusBadge status={reg.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Programs */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Program Tersedia</h2>
          </div>

          {loading && programs.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : programs.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada program tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => {
                const registered = isRegistered(program.id)
                return (
                  <div
                    key={program.id}
                    className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                  >
                    <div className="flex-1">
                      {program.image_url ? (
                        <div className="w-full h-40 rounded-xl mb-4 overflow-hidden bg-gray-100">
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
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{program.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{program.description}</p>
                      <div className="flex flex-col gap-2 text-gray-400 text-xs mb-5">
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

                    {registered ? (
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Terdaftar
                        </div>
                        <button
                          onClick={() => setSelectedProgram(program)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Detail
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedProgram(program)}
                        className="btn-primary w-full justify-center mt-auto"
                      >
                        Lihat Detail <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

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
              <div className="mb-6">
                {selectedProgram.image_url ? (
                  <div className="w-full h-48 md:h-64 rounded-2xl mb-6 overflow-hidden bg-gray-100">
                    <img
                      src={selectedProgram.image_url}
                      alt={selectedProgram.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
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
                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3 md:col-span-2">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
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
                {!isRegistered(selectedProgram.id) ? (
                  <button
                    onClick={() => {
                      handleRegister(selectedProgram)
                      setSelectedProgram(null)
                    }}
                    disabled={registering === selectedProgram.id}
                    className="btn-primary px-8"
                  >
                    {registering === selectedProgram.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mendaftar...
                      </span>
                    ) : (
                      <>Daftar Sekarang <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                ) : (
                  <div className="px-6 py-2.5 bg-green-50 text-green-600 font-medium rounded-xl flex items-center gap-2 border border-green-100">
                    <CheckCircle className="w-5 h-5" />
                    Sudah Terdaftar
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal (Xendit Simulation) */}
      {paymentProgram && (
        <XenditSimulation
          amount={paymentProgram.price}
          programTitle={paymentProgram.title}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentProgram(null)}
        />
      )}
    </div>
  )
}

export default StudentDashboard
