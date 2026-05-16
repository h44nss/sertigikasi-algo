import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Program } from '../types'

export const usePrograms = () => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('programs')
      .select('id, title, description, date, venue, price, image_url, quota, registration_deadline, created_at')
      .order('created_at', { ascending: false })

    if (err) {
      console.error('[usePrograms] error:', err.message)
      setError(err.message)
      setLoading(false)
      return
    }

    setPrograms(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    supabase
      .from('programs')
      .select('id, title, description, date, venue, price, image_url, quota, registration_deadline, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          console.error('[usePrograms] error:', err.message)
          setError(err.message)
        } else {
          setPrograms(data ?? [])
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { programs, loading, error, refresh: fetchPrograms }
}
