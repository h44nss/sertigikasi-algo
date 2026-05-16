import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    // IMPORTANT
    storageKey: 'sertifikasi-kampus-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'student-app',
    },
  },
})

// Helper functions
export const nimToEmail = (nim: string): string => `${nim}@kampus.com`

export const emailToNim = (email: string): string =>
  email.replace('@kampus.com', '')