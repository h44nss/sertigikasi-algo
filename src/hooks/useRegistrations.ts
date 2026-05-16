import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Registration } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const useRegistrations = () => {
  const { profile } = useAuth()
  const userId = profile?.id ?? null

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setRegistrations([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('registrations')
      .select('id, user_id, program_id, status, payment_status, certificate_url, created_at, program:programs(id, title, date, venue, price, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          console.error('[useRegistrations] error:', err.message)
          setError(err.message)
        } else {
          setRegistrations((data ?? []) as unknown as Registration[])
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [userId])

  const refresh = useCallback(() => {
    if (!userId) return

    setLoading(true)
    setError(null)

    supabase
      .from('registrations')
      .select('id, user_id, program_id, status, payment_status, certificate_url, created_at, program:programs(id, title, date, venue, price, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          console.error('[useRegistrations] refresh error:', err.message)
          setError(err.message)
        } else {
          setRegistrations((data ?? []) as unknown as Registration[])
        }
        setLoading(false)
      })
  }, [userId])

  return { registrations, loading, error, refresh }
}
