import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, X, BookOpen, Calendar, AlignLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types'
import { CardSkeleton } from '../../components/Skeleton'
import AdminSidebar from '../../components/AdminSidebar'
import toast from 'react-hot-toast'

const programSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  venue: z.string().min(3, 'Tempat minimal 3 karakter'),
  price: z.number({ error: 'Harga harus berupa angka' }).min(0, 'Harga tidak boleh negatif'),
})

type ProgramForm = z.infer<typeof programSchema>

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramForm, unknown, ProgramForm>({ resolver: zodResolver(programSchema) })

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPrograms(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditingProgram(null)
    reset({ title: '', description: '', date: '', venue: 'Online', price: 0 })
    setShowModal(true)
  }

  const openEdit = (program: Program) => {
    setEditingProgram(program)
    reset({
      title: program.title,
      description: program.description,
      date: program.date.split('T')[0],
      venue: program.venue,
      price: program.price,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProgram(null)
  }

  const onSubmit = async (data: ProgramForm) => {
    setSaving(true)
    if (editingProgram) {
      const { error } = await supabase
        .from('programs')
        .update(data)
        .eq('id', editingProgram.id)
      if (error) {
        toast.error('Gagal mengupdate program')
      } else {
        toast.success('Program berhasil diupdate')
        fetchPrograms()
        closeModal()
      }
    } else {
      const { error } = await supabase.from('programs').insert(data)
      if (error) {
        toast.error('Gagal menambah program')
      } else {
        toast.success('Program berhasil ditambahkan')
        fetchPrograms()
        closeModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus program ini?')) return
    setDeleting(id)
    const { error } = await supabase.from('programs').delete().eq('id', id)
    if (error) {
      toast.error('Gagal menghapus program')
    } else {
      toast.success('Program berhasil dihapus')
      setPrograms(programs.filter((p) => p.id !== id))
    }
    setDeleting(null)
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Kelola Program</h1>
            </div>
            <p className="text-gray-500 text-sm">Tambah, edit, dan hapus program sertifikasi</p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Program
          </button>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : programs.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Belum ada program</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Tambahkan program sertifikasi pertama</p>
            <button onClick={openAdd} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Tambah Program
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="card hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                    {program.description}
                  </p>
                  <div className="flex flex-col gap-2 mt-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
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
                <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(program)}
                    className="btn-secondary flex-1 justify-center text-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(program.id)}
                    disabled={deleting === program.id}
                    className="btn-danger flex-1 justify-center text-sm"
                  >
                    {deleting === program.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProgram ? 'Edit Program' : 'Tambah Program'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Judul Program
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sertifikasi Web Developer"
                  className="input-field"
                  {...register('title')}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Deskripsi
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi program..."
                  className="input-field resize-none"
                  {...register('description')}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  className="input-field"
                  {...register('date')}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tempat / Platform</label>
                  <input
                    type="text"
                    placeholder="Contoh: Zoom, Ruang A1"
                    className="input-field"
                    {...register('venue')}
                  />
                  {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue.message}</p>}
                </div>
                <div>
                  <label className="label">Harga (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000 (0 jika Gratis)"
                    className="input-field"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1 justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 justify-center"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : editingProgram ? 'Simpan Perubahan' : 'Tambah Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgramsPage
