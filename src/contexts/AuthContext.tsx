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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)
  const lastProcessedId = useRef<string | null>(null)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, nim, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        if (isMounted.current) setProfile(null)
        return
      }

      if (data && isMounted.current) {
        setProfile(data as UserProfile)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // FIX: Initial session check to prevent redundant loading state
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (isMounted.current) {
          const userId = session?.user?.id ?? null
          setUser(session?.user ?? null)
          
          if (userId && lastProcessedId.current !== userId) {
            lastProcessedId.current = userId
            await fetchProfile(userId)
          } else if (!userId) {
            lastProcessedId.current = null
            setProfile(null)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (isMounted.current) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return

        try {
          const userId = session?.user?.id ?? null
          
          if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
            lastProcessedId.current = null
          } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user ?? null)
            
            if (userId && lastProcessedId.current !== userId) {
              lastProcessedId.current = userId
              await fetchProfile(userId)
            }
          }
        } catch (err) {
          console.error('AuthContext error during event', event, err)
        } finally {
          if (isMounted.current) setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Safety Timeout: Prevent infinite loading if initialization hangs
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          console.warn('Auth initialization timeout - forcing loading false')
          setLoading(false)
        }
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('Error during signOut:', err)
    } finally {
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
