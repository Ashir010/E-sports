import { isSupabaseConfigured } from '../lib/supabase.js';
import { demoApi } from './demoApi.js';
import { supabaseApi } from './supabaseApi.js';

/**
 * Single data API used by the whole app. Routes to Supabase when credentials
 * are configured, otherwise to the browser-only demo store.
 */
export const api = isSupabaseConfigured ? supabaseApi : demoApi;
export const isDemoMode = !isSupabaseConfigured;
