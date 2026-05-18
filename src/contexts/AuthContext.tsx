import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
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

async function fetchProfileFromDB(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, nim, role, avatar_url')
    .eq('id', userId)
    .maybeSingle()


  if (error) {
    console.error('[Auth] fetchProfile error:', error.message)
    return null
  }
  return (data as UserProfile) ?? null
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Prevents double profile fetch when getSession() and onAuthStateChange
  // both fire for the same user on mount (especially in StrictMode)
  const initializedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    // Fallback timeout to prevent infinite loading if getSession hangs
    const fallbackTimer = setTimeout(() => {
      if (!initializedRef.current && !cancelled) {
        console.warn('[Auth] Session fetch timeout, resolving loading state to prevent deadlock.')
        initializedRef.current = true
        setLoading(false)
      }
    }, 5000)

    // Step 1: Hydrate from existing session immediately
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) console.error('[Auth] getSession error:', error.message)
      if (cancelled) return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        const p = await fetchProfileFromDB(u.id)
        if (!cancelled) setProfile(p)
      }

      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true
        setLoading(false)
      }
    }).catch(err => {
      console.error('[Auth] getSession critical error:', err)
      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true
        setLoading(false)
      }
    })

    // Step 2: Listen for future auth state changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return

      // Skip INITIAL_SESSION — already handled by getSession() above.
      // This prevents double profile fetch on first load.
      if (event === 'INITIAL_SESSION') {
        if (!initializedRef.current) {
          initializedRef.current = true
          setLoading(false)
        }
        return
      }

      const u = session?.user ?? null

      if (event === 'SIGNED_IN') {
        setUser(u)
        if (u) {
          const p = await fetchProfileFromDB(u.id)
          if (!cancelled) setProfile(p)
        }
        // If loading was still true (getSession hadn't resolved yet), resolve it now
        if (!cancelled && !initializedRef.current) {
          initializedRef.current = true
          setLoading(false)
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }

      if (event === 'USER_UPDATED') {
        setUser(u)
        if (u) {
          const p = await fetchProfileFromDB(u.id)
          if (!cancelled) setProfile(p)
        }
      }
      // TOKEN_REFRESHED: Supabase handles this internally — no action needed
    })

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await fetchProfileFromDB(user.id)
    setProfile(p)
  }, [user])

  const signOut = async () => {
    // onAuthStateChange(SIGNED_OUT) will clear user + profile state
    await supabase.auth.signOut()
  }

  const value = React.useMemo(
    () => ({ user, profile, loading, signOut, refreshProfile }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, loading, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
