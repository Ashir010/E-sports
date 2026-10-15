import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True only when both public Supabase credentials are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** The browser client uses the public anon key only. RLS enforces all permissions. */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
