import React, { useEffect, useState } from 'react'
import {
  GraduationCap,
  Download,
  Calendar,
  FileText,
  Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Registration } from '../types'
import { TableRowSkeleton } from '../components/Skeleton'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'

const MyRegistrations: React.FC = () => {
  const { profile } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filtered, setFiltered] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // FIX: Use profile?.id (stable string) instead of profile (object reference).
  // Using the object causes re-fetch on every AuthContext re-render (e.g. TOKEN_REFRESHED).
  useEffect(() => {
    fetchRegistrations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  useEffect(() => {
    let result = registrations
    if (search) {
      result = result.filter((r) =>
        r.program?.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }
    setFiltered(result)
  }, [registrations, search, statusFilter])

  const fetchRegistrations = async () => {
    if (!profile) {
      setLoading(false)
      return
    }
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, program:programs(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching my registrations:', error)
      if (!error && data) setRegistrations(data)
    } catch (err) {
      console.error('Unexpected error in MyRegistrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (reg: Registration) => {
    if (!reg.certificate_url) {
      toast.error('Sertifikat belum tersedia')
      return
    }

    try {
      // Try to get the public URL or signed URL
      const url = reg.certificate_url

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `Sertifikat_${reg.program?.title || 'Program'}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Mengunduh sertifikat...')
    } catch {
      toast.error('Gagal mengunduh sertifikat')
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pendaftaran Saya</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola dan pantau status pendaftaran programmu</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari program..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field sm:w-44"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Registrations Grid */}
        {loading ? (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Program', 'Tanggal Daftar', 'Status', 'Sertifikat'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => <TableRowSkeleton key={i} cols={4} />)}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {search || statusFilter !== 'all' ? 'Tidak ada hasil ditemukan' : 'Belum ada pendaftaran'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {!search && statusFilter === 'all' && 'Kunjungi dashboard untuk mendaftar program'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sertifikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{reg.program?.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {reg.program?.date ? formatDate(reg.program.date) : '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(reg.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={reg.status} />
                      </td>
                      <td className="px-6 py-4">
                        {reg.status === 'approved' && reg.certificate_url ? (
                          <button
                            onClick={() => handleDownload(reg)}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        ) : reg.status === 'approved' ? (
                          <span className="text-xs text-gray-400 italic">Sertifikat belum diupload</span>
                        ) : (
                          <button disabled className="btn-primary text-xs px-3 py-1.5 opacity-40 cursor-not-allowed">
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((reg) => (
                <div key={reg.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{reg.program?.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Daftar: {formatDate(reg.created_at)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={reg.status} />
                  </div>

                  {reg.status === 'approved' && reg.certificate_url && (
                    <button
                      onClick={() => handleDownload(reg)}
                      className="btn-primary w-full justify-center text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Sertifikat
                    </button>
                  )}
                  {reg.status === 'approved' && !reg.certificate_url && (
                    <p className="text-xs text-gray-400 text-center italic mt-2">Sertifikat belum diupload oleh admin</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Summary */}
        {!loading && registrations.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Menampilkan {filtered.length} dari {registrations.length} pendaftaran
          </p>
        )}
      </div>
    </div>
  )
}

export default MyRegistrations
