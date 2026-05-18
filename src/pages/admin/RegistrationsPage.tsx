import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import {
  CheckCircle,
  XCircle,
  Upload,
  Search,
  ClipboardList,
  X,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Registration } from '../../types'
import { TableRowSkeleton } from '../../components/Skeleton'
import AdminSidebar from '../../components/AdminSidebar'
import StatusBadge from '../../components/StatusBadge'
import toast from 'react-hot-toast'

// Externalized helper
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

// Memoized Registration Row — prevents re-render of every row on filter change
const RegistrationRow = React.memo(({
  reg,
  onApprove,
  onReject,
  onUpload,
  processing
}: {
  reg: Registration,
  onApprove: (r: Registration) => void,
  onReject: (r: Registration) => void,
  onUpload: (r: Registration) => void,
  processing: string | null
}) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div>
        <p className="font-medium text-gray-900 text-sm">{reg.user?.name}</p>
        <p className="text-xs text-gray-400">NIM: {reg.user?.nim}</p>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-700 max-w-[180px]">
      <p className="truncate" title={reg.program?.title}>{reg.program?.title}</p>
    </td>
    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
      {formatDate(reg.created_at)}
    </td>
    <td className="px-6 py-4">
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${reg.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {reg.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
      </span>
    </td>
    <td className="px-6 py-4">
      <StatusBadge status={reg.status} />
    </td>
    <td className="px-6 py-4">
      {reg.status === 'approved' ? (
        <button
          onClick={() => onUpload(reg)}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {reg.certificate_url ? 'Ganti' : 'Upload'}
        </button>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      )}
    </td>
    <td className="px-6 py-4">
      {reg.status === 'pending' ? (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(reg)}
            disabled={processing === reg.id}
            className="btn-success text-xs px-3 py-1.5"
          >
            {processing === reg.id ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Setuju
          </button>
          <button
            onClick={() => onReject(reg)}
            disabled={processing === reg.id}
            className="btn-danger text-xs px-3 py-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Tolak
          </button>
        </div>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      )}
    </td>
  </tr>
))
RegistrationRow.displayName = 'RegistrationRow'

const PAGE_SIZE = 25

const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [uploadModal, setUploadModal] = useState<Registration | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchRegistrations = useCallback(async (currentPage: number, currentStatus: string) => {
    if (isMounted.current) setLoading(true)

    try {
      let query = supabase
        .from('registrations')
        .select('*, program:programs(id, title), user:users(name, nim, id)', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (currentStatus !== 'all') {
        query = query.eq('status', currentStatus)
      }

      const from = currentPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error
      if (isMounted.current) {
        setRegistrations(data || [])
        setTotalCount(count ?? 0)
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
      toast.error('Gagal memuat pendaftaran')
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchRegistrations(0, 'all')
  }, [fetchRegistrations])

  // Re-fetch when status filter or page changes
  useEffect(() => {
    fetchRegistrations(page, statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  // Client-side search filter (only on the current page in memory)
  const filtered = useMemo(() => {
    if (!search) return registrations
    const searchLower = search.toLowerCase()
    return registrations.filter(
      (r) =>
        r.user?.name.toLowerCase().includes(searchLower) ||
        r.user?.nim.includes(searchLower) ||
        r.program?.title.toLowerCase().includes(searchLower)
    )
  }, [registrations, search])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleApprove = useCallback(async (reg: Registration) => {
    if (processing) return
    setProcessing(reg.id)
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'approved' })
        .eq('id', reg.id)

      if (error) throw error

      toast.success('Pendaftaran Lulus')
      if (isMounted.current) {
        setUploadModal({ ...reg, status: 'approved' })
        setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'approved' } : r))
      }
    } catch (err) {
      toast.error('Gagal menyetujui')
      console.error(err)
    } finally {
      if (isMounted.current) setProcessing(null)
    }
  }, [processing])

  const handleReject = useCallback(async (reg: Registration) => {
    if (!window.confirm('Yakin ingin menolak pendaftaran ini?')) return
    if (processing) return
    setProcessing(reg.id)

    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'rejected' })
        .eq('id', reg.id)

      if (error) throw error

      toast.success('Pendaftaran Tidak Lulus')
      if (isMounted.current) {
        setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'rejected' } : r))
      }
    } catch (err) {
      toast.error('Gagal menolak')
      console.error(err)
    } finally {
      if (isMounted.current) setProcessing(null)
    }
  }, [processing])

  const handleUploadCertificate = async () => {
    if (!uploadModal || !fileRef.current?.files?.[0]) {
      toast.error('Pilih file terlebih dahulu')
      return
    }

    const file = fileRef.current.files[0]
    setUploading(true)
    const fileName = `${uploadModal.id}_${Date.now()}_cert`

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(uploadData.path)

      const { error: updateError } = await supabase
        .from('registrations')
        .update({ certificate_url: publicUrl })
        .eq('id', uploadModal.id)

      if (updateError) throw updateError

      toast.success('Sertifikat diupload!')
      if (isMounted.current) {
        setUploadModal(null)
        setRegistrations(prev => prev.map(r => r.id === uploadModal.id ? { ...r, certificate_url: publicUrl } : r))
      }
    } catch (err: any) {
      toast.error('Gagal upload')
      console.error(err)
    } finally {
      if (isMounted.current) setUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pendaftaran</h1>
            </div>
            <p className="text-gray-500 text-sm">Setujui atau tolak pendaftaran mahasiswa</p>
          </div>
        </div>

        <div className="card mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari mahasiswa atau program..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
              className="input-field sm:w-44 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Lulus</option>
              <option value="rejected">Tidak Lulus</option>
            </select>
          </div>
        </div>

        <div className="card overflow-hidden p-0 shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Mahasiswa', 'Program', 'Tanggal', 'Status Pembayaran', 'Status Kelulusan', 'Sertifikat', 'Aksi'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && registrations.length === 0 ? (
                  [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400">Tidak ada pendaftaran ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((reg) => (
                    <RegistrationRow
                      key={reg.id}
                      reg={reg}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onUpload={setUploadModal}
                      processing={processing}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Halaman {page + 1} dari {totalPages} · {totalCount} total pendaftaran
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Upload Sertifikat</h2>
              <button onClick={() => setUploadModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Klik untuk memilih file</p>
              </div>

              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />

              <div className="flex gap-3 mt-6">
                <button onClick={() => setUploadModal(null)} className="btn-secondary flex-1">Batal</button>
                <button onClick={handleUploadCertificate} disabled={uploading} className="btn-primary flex-1">
                  {uploading ? 'Mengupload...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrationsPage
