import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Program, Registration } from '../types'
import { CardSkeleton } from '../components/Skeleton'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'

const StudentDashboard: React.FC = () => {
  const { profile } = useAuth()
  const location = useLocation()
  const [programs, setPrograms] = useState<Program[]>([])
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [paymentProgram, setPaymentProgram] = useState<Program | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  // FIX: Use profile?.id (stable string) instead of profile (object reference).
  // Using the object causes re-fetch on every AuthContext re-render (e.g. TOKEN_REFRESHED).
  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  useEffect(() => {
    // Handle redirect from landing page for a specific program
    if (location.state?.registerProgramId && programs.length > 0) {
      const program = programs.find(p => p.id === location.state.registerProgramId)
      if (program) {
        setSelectedProgram(program)
        // Clear the state so it doesn't trigger again on refresh
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, programs])

  const fetchData = async () => {
    if (!profile) {
      setLoading(false)
      return
    }
    // Only show skeleton on initial load or if data is empty to prevent "loading flicker"
    if (programs.length === 0) {
      setLoading(true)
    }

    try {
      const [{ data: programsData, error: progErr }, { data: regsData, error: regErr }] = await Promise.all([
        supabase.from('programs').select('*').order('created_at', { ascending: false }),
        supabase
          .from('registrations')
          .select('*, program:programs(*)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
      ])

      if (progErr) console.error('Error fetching programs:', progErr)
      if (regErr) console.error('Error fetching registrations:', regErr)

      setPrograms(programsData || [])
      setMyRegistrations(regsData || [])
    } catch (err) {
      console.error('Unexpected error in StudentDashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const isRegistered = (programId: string) =>
    myRegistrations.some((r) => r.program_id === programId)

  const handleRegister = async (program: Program) => {
    if (!profile) return
    if (isRegistered(program.id)) {
      toast('Kamu sudah mendaftar program ini', { icon: 'ℹ️' })
      return
    }

    if (program.price > 0) {
      setPaymentProgram(program)
      return
    }

    // Free program, direct registration
    executeRegistration(program.id, 'paid') // For free programs, mark as paid
  }

  const executeRegistration = async (programId: string, paymentStatus: 'unpaid' | 'paid') => {
    if (!profile) return
    setRegistering(programId)
    const { error } = await supabase.from('registrations').insert({
      user_id: profile.id,
      program_id: programId,
      status: 'pending',
      payment_status: paymentStatus,
      certificate_url: null,
    })

    if (error) {
      toast.error('Gagal mendaftar program')
    } else {
      toast.success('Berhasil mendaftar program')
      fetchData()
    }
    setRegistering(null)
  }

  const handlePayment = async () => {
    if (!paymentProgram) return
    setProcessingPayment(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    await executeRegistration(paymentProgram.id, 'paid')
    setProcessingPayment(false)
    setPaymentProgram(null)
  }

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

  const stats = [
    {
      label: 'Program Terdaftar',
      value: myRegistrations.length,
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Disetujui',
      value: myRegistrations.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Menunggu',
      value: myRegistrations.filter((r) => r.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ]

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
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Registrations */}
        {myRegistrations.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pendaftaran Terbaru</h2>
              <Link to="/my-registrations" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {myRegistrations.slice(0, 3).map((reg) => (
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

          {loading ? (
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
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
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
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
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

      {/* Payment Modal */}
      {paymentProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Simulasi Pembayaran
              </h2>
              <button
                onClick={() => setPaymentProgram(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={processingPayment}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Total Tagihan untuk:</p>
                <p className="font-semibold text-gray-900 mb-3">{paymentProgram.title}</p>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-500">Total Pembayaran</span>
                  <span className="text-xl font-bold text-blue-600">{formatPrice(paymentProgram.price)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="btn-primary w-full justify-center py-3"
                >
                  {processingPayment ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    'Bayar Sekarang'
                  )}
                </button>
                <button
                  onClick={() => setPaymentProgram(null)}
                  disabled={processingPayment}
                  className="btn-secondary w-full justify-center py-3"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
