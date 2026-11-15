import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (Boolean(url) !== Boolean(anonKey)) {
  throw new Error('Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase.');
}

export const hasSupabaseConfig = Boolean(url && anonKey);
export const supabase = url && anonKey ? createClient<Database>(url, anonKey) : null;
