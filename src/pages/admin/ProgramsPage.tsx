import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types'
import { CardSkeleton } from '../../components/Skeleton'
import AdminSidebar from '../../components/AdminSidebar'
import ProgramModal from './ProgramModal'
import toast from 'react-hot-toast'

// Memoized Program Card for Admin
const AdminProgramCard = React.memo(({ program, onEdit, onDelete, deleting }: { 
  program: Program, 
  onEdit: (p: Program) => void, 
  onDelete: (id: string) => void,
  deleting: string | null 
}) => {
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
    <div className="card hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <div className="flex-1">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{program.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
          {program.description}
        </p>
        <div className="flex flex-col gap-2 mt-4 text-gray-500 text-xs">
          <div className="flex items-center gap-2">
            <span>📅</span> {formatDate(program.date)}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-700">📍 {program.venue}</span>
            <span className="font-bold text-blue-600">
              {program.price === 0 ? 'Gratis' : formatPrice(program.price)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
        <button
          onClick={() => onEdit(program)}
          className="btn-secondary flex-1 justify-center text-xs"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(program.id)}
          disabled={deleting === program.id}
          className="btn-danger flex-1 justify-center text-xs"
        >
          {deleting === program.id ? '...' : 'Hapus'}
        </button>
      </div>
    </div>
  )
})
AdminProgramCard.displayName = 'AdminProgramCard'

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [modalState, setModalState] = useState<{ open: boolean, program: Program | null }>({ open: false, program: null })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchPrograms = useCallback(async (showSkeleton = false) => {
    if (showSkeleton && isMounted.current) setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (isMounted.current) setPrograms(data || [])
    } catch (err) {
      console.error('Error fetching programs:', err)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrograms(true)
  }, [fetchPrograms])

  const handleOpenAdd = useCallback(() => setModalState({ open: true, program: null }), [])
  const handleOpenEdit = useCallback((p: Program) => setModalState({ open: true, program: p }), [])
  const handleCloseModal = useCallback(() => setModalState({ open: false, program: null }), [])

  const handleSubmit = async (data: any, posterFile: File | null) => {
    if (saving) return
    setSaving(true)
    
    try {
      let imageUrl = modalState.program?.image_url || ''

      if (posterFile) {
        const fileExt = posterFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('posters')
          .upload(fileName, posterFile)
        
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(uploadData.path)
        imageUrl = publicUrl
      }

      const { error } = modalState.program 
        ? await supabase.from('programs').update({ ...data, image_url: imageUrl }).eq('id', modalState.program.id)
        : await supabase.from('programs').insert({ ...data, image_url: imageUrl })

      if (error) throw error

      toast.success(modalState.program ? 'Program diupdate' : 'Program ditambahkan')
      fetchPrograms()
      handleCloseModal()
    } catch (err) {
      toast.error('Gagal menyimpan program')
    } finally {
      if (isMounted.current) setSaving(false)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Hapus program ini?')) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('programs').delete().eq('id', id)
      if (error) throw error
      toast.success('Program dihapus')
      if (isMounted.current) setPrograms(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast.error('Gagal menghapus')
    } finally {
      if (isMounted.current) setDeleting(null)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Program</h1>
            <p className="text-gray-500 text-sm">Tambah, edit, dan hapus program sertifikasi</p>
          </div>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Program
          </button>
        </div>

        {loading && programs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : programs.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Belum ada program</p>
            <button onClick={handleOpenAdd} className="btn-primary mx-auto mt-4">Tambah Sekarang</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <AdminProgramCard 
                key={program.id} 
                program={program} 
                onEdit={handleOpenEdit} 
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </main>

      {modalState.open && (
        <ProgramModal 
          program={modalState.program}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}
    </div>
  )
}

export default ProgramsPage
