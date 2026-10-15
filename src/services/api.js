import { supabaseApi } from './supabaseApi.js';

/** Single data API used by the whole app. All data lives in Supabase. */
export const api = supabaseApi;
export { isSupabaseConfigured } from '../lib/supabase.js';
