import { createClient } from '@supabase/supabase-js'

// Factory com fallback de placeholder — evita "supabaseUrl is required"
// durante o prerendering quando as env vars não estão presentes no build.
let _client = null
export const supabase = (() => {
  if (_client) return _client
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  )
  return _client
})()
