import { createClient } from '@supabase/supabase-js'
export const db = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'fieldops-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
