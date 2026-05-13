import React, { useMemo, useCallback } from 'react'
import {
  GraduationCap,
  Download,
  Calendar,
  FileText,
  Search,
} from 'lucide-react'
import { useRegistrations } from '../hooks/useRegistrations'
import type { Registration } from '../types'
import { TableRowSkeleton } from '../components/Skeleton'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import { useState } from 'react'
import toast from 'react-hot-toast'

// Externalized helpers
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

// Memoized Table Row
const RegistrationRow = React.memo(({ reg, onDownload }: { reg: Registration, onDownload: (reg: Registration) => void }) => (
  <tr className="hover:bg-gray-50 transition-colors group">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
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
          onClick={() => onDownload(reg)}
          className="btn-primary text-xs px-3 py-1.5 shadow-sm hover:shadow-md active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      ) : reg.status === 'approved' ? (
        <span className="text-xs text-gray-400 italic">Belum diupload</span>
      ) : (
        <button disabled className="btn-primary text-xs px-3 py-1.5 opacity-30 cursor-not-allowed grayscale">
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      )}
    </td>
  </tr>
))
RegistrationRow.displayName = 'RegistrationRow'

const MyRegistrations: React.FC = () => {
  // Use the shared hook with cache — no duplicate fetch!
  const { registrations, loading } = useRegistrations()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let result = registrations
    const searchLower = search.toLowerCase()

    if (searchLower) {
      result = result.filter((r) =>
        r.program?.title?.toLowerCase().includes(searchLower)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }

    return result
  }, [registrations, search, statusFilter])

  const handleDownload = useCallback(async (reg: Registration) => {
    if (!reg.certificate_url) {
      toast.error('Sertifikat belum tersedia')
      return
    }

    try {
      const link = document.createElement('a')
      link.href = reg.certificate_url
      link.download = `Sertifikat_${reg.program?.title || 'Program'}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Mengunduh sertifikat...')
    } catch {
      toast.error('Gagal mengunduh sertifikat')
    }
  }, [])

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
        <div className="card mb-6 animate-fade-in">
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
              className="input-field sm:w-44 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Registrations List */}
        {loading && registrations.length === 0 ? (
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
          <div className="card text-center py-16 animate-fade-in">
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
            <div className="hidden md:block card overflow-hidden p-0 shadow-sm animate-fade-in">
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
                    <RegistrationRow key={reg.id} reg={reg} onDownload={handleDownload} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 animate-fade-in">
              {filtered.map((reg) => (
                <div key={reg.id} className="card group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
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
                      className="btn-primary w-full justify-center text-sm shadow-sm"
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
          <p className="text-xs text-gray-400 text-center mt-6">
            Menampilkan {filtered.length} dari {registrations.length} pendaftaran
          </p>
        )}
      </div>
    </div>
  )
}

export default MyRegistrations
