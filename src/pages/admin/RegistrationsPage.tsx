import React, { useEffect, useState, useRef } from 'react'
import {
  CheckCircle,
  XCircle,
  Upload,
  Search,
  ClipboardList,
  X,
  GraduationCap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Registration } from '../../types'
import { TableRowSkeleton } from '../../components/Skeleton'
import AdminSidebar from '../../components/AdminSidebar'
import StatusBadge from '../../components/StatusBadge'
import toast from 'react-hot-toast'

const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filtered, setFiltered] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [uploadModal, setUploadModal] = useState<Registration | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  useEffect(() => {
    let result = registrations
    if (search) {
      result = result.filter(
        (r) =>
          r.user?.name.toLowerCase().includes(search.toLowerCase()) ||
          r.user?.nim.includes(search) ||
          r.program?.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }
    setFiltered(result)
  }, [registrations, search, statusFilter])

  const fetchRegistrations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('registrations')
      .select('*, program:programs(*), user:users(name, nim, id)')
      .order('created_at', { ascending: false })
    if (!error) setRegistrations(data || [])
    setLoading(false)
  }

  const handleApprove = async (reg: Registration) => {
    setProcessing(reg.id)
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'approved' })
      .eq('id', reg.id)

    if (error) {
      toast.error('Gagal menyetujui pendaftaran')
    } else {
      toast.success('Pendaftaran disetujui')
      // Open upload modal after approve
      setUploadModal({ ...reg, status: 'approved' })
      fetchRegistrations()
    }
    setProcessing(null)
  }

  const handleReject = async (reg: Registration) => {
    if (!window.confirm('Yakin ingin menolak pendaftaran ini?')) return
    setProcessing(reg.id)
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'rejected' })
      .eq('id', reg.id)

    if (error) {
      toast.error('Gagal menolak pendaftaran')
    } else {
      toast.success('Pendaftaran ditolak')
      fetchRegistrations()
    }
    setProcessing(null)
  }

  const handleUploadCertificate = async () => {
    if (!uploadModal || !fileRef.current?.files?.[0]) {
      toast.error('Pilih file terlebih dahulu')
      return
    }

    const file = fileRef.current.files[0]
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setUploading(true)
    const fileName = `${uploadModal.id}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error(`Gagal mengupload: ${uploadError.message}`)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(uploadData.path)

    // Update registration with certificate URL
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ certificate_url: publicUrl })
      .eq('id', uploadModal.id)

    if (updateError) {
      toast.error('Gagal menyimpan URL sertifikat')
    } else {
      toast.success('Sertifikat berhasil diupload!')
      setUploadModal(null)
      fetchRegistrations()
    }
    setUploading(false)
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pendaftaran</h1>
            </div>
            <p className="text-gray-500 text-sm">Setujui atau tolak pendaftaran mahasiswa</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600">
              {registrations.filter((r) => r.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-400">Menunggu Review</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
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

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Mahasiswa', 'Program', 'Tanggal', 'Status', 'Pembayaran', 'Sertifikat', 'Aksi'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} cols={6} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400">Tidak ada pendaftaran ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{reg.user?.name}</p>
                          <p className="text-xs text-gray-400">NIM: {reg.user?.nim}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-[180px]">
                        <p className="truncate">{reg.program?.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(reg.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={reg.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${reg.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {reg.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {reg.status === 'approved' ? (
                          <button
                            onClick={() => setUploadModal(reg)}
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
                              onClick={() => handleApprove(reg)}
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
                              onClick={() => handleReject(reg)}
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
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              Menampilkan {filtered.length} dari {registrations.length} pendaftaran
            </div>
          )}
        </div>
      </main>

      {/* Upload Certificate Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upload Sertifikat</h2>
                <p className="text-sm text-gray-400 mt-0.5">{uploadModal.user?.name} · {uploadModal.program?.title}</p>
              </div>
              <button
                onClick={() => setUploadModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {uploadModal.certificate_url && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Sertifikat sudah ada. Upload baru akan menggantikan yang lama.
                </div>
              )}

              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                <p className="text-sm text-gray-500 group-hover:text-blue-600 font-medium transition-colors">
                  Klik untuk memilih file
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (maks. 10MB)</p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) toast(`File dipilih: ${f.name}`, { icon: '📄' })
                }}
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setUploadModal(null)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUploadCertificate}
                  disabled={uploading}
                  className="btn-primary flex-1 justify-center"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengupload...
                    </span>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload Sertifikat</>
                  )}
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
