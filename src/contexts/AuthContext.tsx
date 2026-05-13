import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Clears ALL Supabase auth keys from localStorage (any key format) */
const clearAuthStorage = () => {
  try {
    const keysToRemove = Object.keys(localStorage).filter(
      k => k.startsWith('sb-') || k.includes('supabase') || k.includes('auth-token')
    )
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch {
    // localStorage might be unavailable in some environments
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)
  const initDone = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, nim, role')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error.message)
        if (isMounted.current) setProfile(null)
        return
      }
      if (isMounted.current) setProfile(data as UserProfile ?? null)
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let ignore = false

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (ignore) return

        // If Supabase returned an auth error, the stored token is invalid/expired
        // Clear it so the next load starts clean instead of loading forever
        if (error) {
          console.warn('Auth token invalid, clearing storage:', error.message)
          clearAuthStorage()
          if (isMounted.current) {
            setUser(null)
            setProfile(null)
          }
          return
        }

        initDone.current = true
        const u = session?.user ?? null
        if (isMounted.current) setUser(u)
        if (u) await fetchProfile(u.id)

      } catch (err: any) {
        // Network error or token completely corrupted — clear it
        console.warn('Auth init failed, clearing token:', err?.message)
        clearAuthStorage()
        if (isMounted.current) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (!ignore && isMounted.current) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return

        // INITIAL_SESSION is handled by initAuth above — skip to avoid double fetch
        if (event === 'INITIAL_SESSION') {
          if (!initDone.current) {
            initDone.current = true
            const u = session?.user ?? null
            if (isMounted.current) setUser(u)
            if (u) await fetchProfile(u.id)
            if (isMounted.current) setLoading(false)
          }
          return
        }

        if (event === 'SIGNED_OUT') {
          if (isMounted.current) {
            setUser(null)
            setProfile(null)
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const u = session?.user ?? null
          if (isMounted.current) setUser(u)
          if (u) await fetchProfile(u.id)
        }

        if (isMounted.current) setLoading(false)
      }
    )

    initAuth()

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Hard fallback: if still loading after 6s, clear token & reset
  // This handles edge cases like network timeout during token refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn('Auth timeout — clearing potentially stale token')
        clearAuthStorage()
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }, 6000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('Error during signOut:', err)
    } finally {
      clearAuthStorage()
      if (isMounted.current) {
        setUser(null)
        setProfile(null)
      }
    }
  }, [])

  const value = React.useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }), [user, profile, loading, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
