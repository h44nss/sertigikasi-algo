import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Registration } from '../types'
import { useAuth } from '../contexts/AuthContext'

// Per-user module-level cache
let cachedRegistrations: Registration[] | null = null
let lastUserId: string | null = null
let isFetching = false
const listeners: Array<() => void> = []

const notifyListeners = () => listeners.forEach(fn => fn())

const fetchFromDB = async (userId: string) => {
  if (isFetching) return
  isFetching = true

  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, user_id, program_id, status, payment_status, certificate_url, created_at, program:programs(id, title, date, venue, price, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    cachedRegistrations = (data || []) as unknown as Registration[]
    lastUserId = userId
  } catch (err) {
    console.error('Error fetching registrations:', err)
    cachedRegistrations = []
  } finally {
    isFetching = false
    notifyListeners()
  }
}

export const useRegistrations = () => {
  const { profile } = useAuth()
  const userId = profile?.id ?? null

  const isCacheValid = cachedRegistrations !== null && lastUserId === userId

  const [registrations, setRegistrations] = useState<Registration[]>(isCacheValid ? cachedRegistrations! : [])
  const [loading, setLoading] = useState(userId !== null && !isCacheValid)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const listener = () => {
      if (isMounted.current) {
        setRegistrations(cachedRegistrations || [])
        setLoading(false)
      }
    }
    listeners.push(listener)

    if (!userId) {
      // Logged out — clear everything
      cachedRegistrations = null
      lastUserId = null
      setRegistrations([])
      setLoading(false)
    } else if (cachedRegistrations !== null && lastUserId === userId) {
      // Cache hit
      setRegistrations(cachedRegistrations)
      setLoading(false)
    } else {
      // Cache miss — fetch
      fetchFromDB(userId)
    }

    return () => {
      isMounted.current = false
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [userId])

  const refresh = useCallback(() => {
    if (!userId) return
    cachedRegistrations = null
    if (isMounted.current) setLoading(true)
    fetchFromDB(userId)
  }, [userId])

  return { registrations, loading, error: null, refresh }
}
