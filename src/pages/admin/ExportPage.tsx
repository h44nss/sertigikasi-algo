import React, { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Registration } from '../../types'
import { TableRowSkeleton } from '../../components/Skeleton'
import AdminSidebar from '../../components/AdminSidebar'
import StatusBadge from '../../components/StatusBadge'
import toast from 'react-hot-toast'

const ExportPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('registrations')
      .select('*, program:programs(*), user:users(name, nim)')
      .order('created_at', { ascending: false })
    if (!error) setRegistrations(data || [])
    setLoading(false)
  }

  const filtered = statusFilter === 'all'
    ? registrations
    : registrations.filter((r) => r.status === statusFilter)

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    setExporting(true)

    const headers = ['No', 'Nama Mahasiswa', 'NIM', 'Program', 'Status', 'Tanggal Daftar', 'Sertifikat URL']
    const rows = filtered.map((reg, i) => [
      i + 1,
      reg.user?.name || '',
      reg.user?.nim || '',
      reg.program?.title || '',
      reg.status,
      new Date(reg.created_at).toLocaleDateString('id-ID'),
      reg.certificate_url || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `registrasi_sertifikasi_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Data berhasil diekspor ke CSV')
    setExporting(false)
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  const statusCount = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === 'pending').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
            </div>
            <p className="text-gray-500 text-sm">Export data pendaftaran ke file CSV</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="btn-primary"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengexport...
              </span>
            ) : (
              <><FileSpreadsheet className="w-4 h-4" /> Export CSV</>
            )}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: statusCount.all, color: 'text-gray-900', bg: 'bg-gray-50' },
            { label: 'Menunggu', value: statusCount.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Disetujui', value: statusCount.approved, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Ditolak', value: statusCount.rejected, color: 'text-red-700', bg: 'bg-red-50' },
          ].map((s, i) => (
            <div key={i} className={`card ${s.bg}`}>
              <p className="text-sm text-gray-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter Status:</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: `Semua (${statusCount.all})` },
                { value: 'pending', label: `Menunggu (${statusCount.pending})` },
                { value: 'approved', label: `Disetujui (${statusCount.approved})` },
                { value: 'rejected', label: `Ditolak (${statusCount.rejected})` },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                    statusFilter === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['No', 'Mahasiswa', 'NIM', 'Program', 'Tanggal', 'Status', 'Sertifikat'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filtered.map((reg, i) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{reg.user?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{reg.user?.nim}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px]">
                        <p className="truncate">{reg.program?.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(reg.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={reg.status} />
                      </td>
                      <td className="px-6 py-4">
                        {reg.certificate_url ? (
                          <a
                            href={reg.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Lihat
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} data siap diekspor
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ExportPage
