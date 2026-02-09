import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ngyarhcefnapnucdjleo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build'

let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = typeof window !== 'undefined' 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        signInWithOAuth: async () => ({ data: null, error: null }),
        getSession: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
      },
    } as any
