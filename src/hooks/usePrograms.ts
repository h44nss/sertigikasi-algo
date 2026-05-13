import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Program } from '../types'

// Module-level cache: persists across component mounts within same session
let cachedPrograms: Program[] | null = null
let isFetching = false
const listeners: Array<() => void> = []

const notifyListeners = () => listeners.forEach(fn => fn())

const fetchFromDB = async () => {
  if (isFetching) return
  isFetching = true

  try {
    const { data, error } = await supabase
      .from('programs')
      .select('id, title, description, date, venue, price, image_url, quota, registration_deadline, registrations(count)')
      .order('created_at', { ascending: false })

    if (error) throw error

    cachedPrograms = (data || []).map(p => ({
      ...p,
      registered_count: (p.registrations as any)?.[0]?.count || 0,
      registrations: undefined,
    })) as Program[]
  } catch (err) {
    console.error('Error fetching programs:', err)
    cachedPrograms = []
  } finally {
    isFetching = false
    notifyListeners()
  }
}

export const usePrograms = () => {
  const [programs, setPrograms] = useState<Program[]>(cachedPrograms || [])
  const [loading, setLoading] = useState(!cachedPrograms)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    // Subscribe to cache updates
    const listener = () => {
      if (isMounted.current) {
        setPrograms(cachedPrograms || [])
        setLoading(false)
      }
    }
    listeners.push(listener)

    // If cache is already available, use it immediately
    if (cachedPrograms !== null) {
      setPrograms(cachedPrograms)
      setLoading(false)
    } else {
      // Trigger fetch (deduplication via isFetching flag)
      fetchFromDB()
    }

    return () => {
      isMounted.current = false
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  const refresh = useCallback(() => {
    cachedPrograms = null
    if (isMounted.current) setLoading(true)
    fetchFromDB()
  }, [])

  return { programs, loading, error: null, refresh }
}
