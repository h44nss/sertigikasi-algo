import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Registration } from '../types'
import { useAuth } from '../contexts/AuthContext'

let cachedRegistrations: Registration[] | null = null
let lastUserId: string | null = null

export const useRegistrations = () => {
  const { profile } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>(cachedRegistrations || [])
  const [loading, setLoading] = useState(profile?.id && (!cachedRegistrations || lastUserId !== profile.id) ? true : false)
  const [error, setError] = useState<any>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchRegistrations = useCallback(async (force = false) => {
    if (!profile?.id) return

    // If not forced and we have cache for the same user, skip fetch
    if (cachedRegistrations && lastUserId === profile.id && !force) {
      if (isMounted.current) {
        setRegistrations(cachedRegistrations)
        setLoading(false)
      }
      return
    }

    if (isMounted.current) setLoading(true)
    
    try {
      const { data, error: err } = await supabase
        .from('registrations')
        .select('*, program:programs(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (err) throw err

      cachedRegistrations = data || []
      lastUserId = profile.id
      
      if (isMounted.current) {
        setRegistrations(cachedRegistrations)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
      if (isMounted.current) setError(err)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) {
      if (!cachedRegistrations || lastUserId !== profile.id) {
        fetchRegistrations()
      }
    } else {
      setRegistrations([])
      setLoading(false)
    }
  }, [profile?.id, fetchRegistrations])

  return { 
    registrations, 
    loading, 
    error, 
    refresh: useCallback(() => fetchRegistrations(true), [fetchRegistrations]) 
  }
}
