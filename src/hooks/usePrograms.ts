import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Program } from '../types'

// Simple global-ish cache to prevent redundant fetches within the same session
let cachedPrograms: Program[] | null = null

export const usePrograms = () => {
  const [programs, setPrograms] = useState<Program[]>(cachedPrograms || [])
  const [loading, setLoading] = useState(!cachedPrograms)
  const [error, setError] = useState<any>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchPrograms = useCallback(async (force = false) => {
    // If not forced and we have cache, don't fetch
    if (cachedPrograms && !force) {
      if (isMounted.current) {
        setPrograms(cachedPrograms)
        setLoading(false)
      }
      return
    }

    if (isMounted.current) setLoading(true)
    
    try {
      // Use a single efficient query with join count
      const { data, error: err } = await supabase
        .from('programs')
        .select('*, registrations(count)')
        .order('created_at', { ascending: false })

      if (err) throw err
      
      const mappedData = (data || []).map(p => ({
        ...p,
        registered_count: (p.registrations as any)?.[0]?.count || 0
      })) as Program[]

      cachedPrograms = mappedData
      
      if (isMounted.current) {
        setPrograms(mappedData)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching programs:', err)
      if (isMounted.current) setError(err)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!cachedPrograms) {
      fetchPrograms()
    } else {
      setPrograms(cachedPrograms)
      setLoading(false)
    }
  }, [fetchPrograms])

  return { 
    programs, 
    loading, 
    error, 
    refresh: useCallback(() => fetchPrograms(true), [fetchPrograms]) 
  }
}
