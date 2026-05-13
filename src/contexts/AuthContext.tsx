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

/** Clears ALL Supabase auth keys from localStorage */
const clearAuthStorage = () => {
  try {
    const keysToRemove = Object.keys(localStorage).filter(
      k => k.startsWith('sb-') || k.includes('supabase') || k.includes('auth-token')
    )
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch {
    // localStorage unavailable
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Single ref to track mounted state — managed entirely inside the auth useEffect
  const isMounted = useRef(true)
  // Prevent duplicate profile fetches when both INITIAL_SESSION and SIGNED_IN fire
  const profileFetchedForId = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    // Deduplicate: don't re-fetch for the same user in rapid succession
    if (profileFetchedForId.current === userId) return
    profileFetchedForId.current = userId

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, nim, role')
        .eq('id', userId)
        .maybeSingle()

      if (!isMounted.current) return

      if (error) {
        console.error('Error fetching profile:', error.message)
        setProfile(null)
        return
      }
      setProfile(data as UserProfile ?? null)
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      if (isMounted.current) setProfile(null)
    }
  }, []) // stable — no dependencies change

  const refreshProfile = useCallback(async () => {
    if (!isMounted.current) return
    const currentUser = user
    if (currentUser) {
      // Force re-fetch by clearing dedup guard
      profileFetchedForId.current = null
      await fetchProfile(currentUser.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    isMounted.current = true

    // ─────────────────────────────────────────────────────────────────────
    // SINGLE SOURCE OF TRUTH: onAuthStateChange handles ALL auth events.
    //
    // Supabase v2 automatically fires INITIAL_SESSION synchronously on
    // listener registration — we do NOT need a separate getSession() call.
    // Calling both creates a race condition that causes the double-init bug.
    // ─────────────────────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return

        console.debug('[Auth]', event, session?.user?.id ?? 'no user')

        if (event === 'INITIAL_SESSION') {
          // This is the first (and only) place we initialize auth state.
          const u = session?.user ?? null
          setUser(u)

          if (u) {
            await fetchProfile(u.id)
          } else {
            setProfile(null)
          }

          // Loading resolves here and ONLY here on startup
          if (isMounted.current) setLoading(false)
          return
        }

        if (event === 'SIGNED_IN') {
          const u = session?.user ?? null
          setUser(u)
          if (u) {
            // Reset dedup so we always fetch fresh profile on explicit sign-in
            profileFetchedForId.current = null
            await fetchProfile(u.id)
          }
          return
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          profileFetchedForId.current = null
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token silently refreshed — just update the user object.
          // Do NOT re-fetch profile: it hasn't changed, and this event
          // fires every ~50 minutes, causing unnecessary DB hits.
          if (session?.user) setUser(session.user)
          return
        }

        if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user)
            // Profile data may have changed — force re-fetch
            profileFetchedForId.current = null
            await fetchProfile(session.user.id)
          }
          return
        }
      }
    )

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile]) // fetchProfile is stable (useCallback with [])

  // ─────────────────────────────────────────────────────────────────────
  // Safety timeout: only for true network failures (e.g. offline on load).
  // Uses a ref to read live loading state — avoids stale closure bug.
  // 15 seconds: generous enough to not fire on normal slow connections.
  // Does NOT clear localStorage unless loading is still stuck — meaning
  // INITIAL_SESSION never fired, which indicates a corrupted/stale token.
  // ─────────────────────────────────────────────────────────────────────
  const loadingRef = useRef(true)
  loadingRef.current = loading // always in sync, no stale closure

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadingRef.current) return // already resolved — do nothing

      console.warn('[Auth] Timeout: INITIAL_SESSION never fired. Clearing stale token.')
      clearAuthStorage()

      if (isMounted.current) {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }, 15_000) // 15s — true network timeout, not normal auth latency

    return () => clearTimeout(timer)
  }, []) // runs once on mount

  const signOut = useCallback(async () => {
    try {
      // scope: 'local' signs out only this tab/device
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('Error during signOut:', err)
      // Even if signOut API call fails, clear local storage
      clearAuthStorage()
      if (isMounted.current) {
        setUser(null)
        setProfile(null)
        profileFetchedForId.current = null
      }
    }
    // onAuthStateChange(SIGNED_OUT) will handle state reset for the success path
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
