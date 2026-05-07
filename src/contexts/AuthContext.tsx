import React, { createContext, useContext, useEffect, useState } from 'react'
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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        setProfile(data as UserProfile)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    let mounted = true

    // FIX: Safety-net timeout — if Supabase never fires any event, stop loading after 10s
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 10000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        try {
          if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
          } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchProfile(session.user.id)
            } else {
              setProfile(null)
            }
          } else if (event === 'TOKEN_REFRESHED') {
            // FIX: Only update the user token — do NOT re-fetch profile here.
            // Re-fetching profile on TOKEN_REFRESHED causes a reload loop because
            // the new supabase client fires TOKEN_REFRESHED on every navigation.
            setUser(session?.user ?? null)
          }
        } catch (err) {
          console.error('AuthContext error during event', event, err)
        } finally {
          // FIX: loading=false is now GUARANTEED to fire regardless of errors
          if (mounted) {
            clearTimeout(timeout)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
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
