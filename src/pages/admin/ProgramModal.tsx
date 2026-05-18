import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Program } from '../../types'

const programSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  venue: z.string().min(3, 'Tempat minimal 3 karakter'),
  price: z.number({ error: 'Harga harus angka' }).min(0, 'Harga minimal 0'),
  quota: z.number({ error: 'Kuota harus angka' }).min(1, 'Kuota minimal 1'),
  registration_deadline: z.string().min(1, 'Batas daftar wajib diisi'),
})

type ProgramForm = z.infer<typeof programSchema>

interface ProgramModalProps {
  program: Program | null
  onClose: () => void
  onSubmit: (data: ProgramForm, file: File | null) => Promise<void>
  saving: boolean
}

const ProgramModal: React.FC<ProgramModalProps> = ({
  program,
  onClose,
  onSubmit,
  saving,
}) => {
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    program?.image_url || null
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: program
      ? {
        title: program.title,
        description: program.description,
        date: program.date.split('T')[0],
        venue: program.venue,
        price: program.price,
        quota: program.quota || 50,
        registration_deadline:
          program.registration_deadline?.split('T')[0] || '',
      }
      : {
        venue: 'Online',
        price: 0,
        quota: 50,
      },
  })

  useEffect(() => {
    if (!posterFile) {
      setPreviewUrl(program?.image_url || null)
      return
    }

    const objectUrl = URL.createObjectURL(posterFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [posterFile, program])

  const handleFormSubmit = useCallback(
    async (data: ProgramForm) => {
      await onSubmit(data, posterFile)

      reset()
      setPosterFile(null)

      if (!program) {
        setPreviewUrl(null)
      }
    },
    [onSubmit, posterFile, reset, program]
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {program ? 'Edit Program' : 'Tambah Program'}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar"
        >
          <div>
            <label className="label">Judul Program</label>

            <input
              type="text"
              className="input-field"
              {...register('title')}
            />

            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Deskripsi</label>

            <textarea
              rows={3}
              className="input-field resize-none"
              {...register('description')}
            />

            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">
                Tanggal Pelaksanaan
              </label>

              <input
                type="date"
                className="input-field text-xs"
                {...register('date')}
              />

              {errors.date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div>
              <label className="label text-xs">
                Batas Daftar
              </label>

              <input
                type="date"
                className="input-field text-xs"
                {...register('registration_deadline')}
              />

              {errors.registration_deadline && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.registration_deadline.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tempat</label>

              <input
                type="text"
                className="input-field"
                {...register('venue')}
              />
            </div>

            <div>
              <label className="label">Harga (Rp)</label>

              <input
                type="number"
                className="input-field"
                {...register('price', {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="col-span-2">
              <label className="label">Kuota Peserta</label>

              <input
                type="number"
                className="input-field"
                {...register('quota', {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div>
            <label className="label">
              Upload Poster (Opsional)
            </label>

            <div className="flex items-center gap-3 mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPosterFile(e.target.files?.[0] || null)
                }
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {previewUrl && (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-50 mt-4">
            <button
              type="button"
              onClick={onClose}
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
              ) : (
                'Simpan Program'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default React.memo(ProgramModal)