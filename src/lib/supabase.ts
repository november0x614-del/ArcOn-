import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Gunakan dummy url jika kosong agar aplikasi tidak crash (White Screen) saat development
const urlToUse = supabaseUrl || 'https://xyzcompany.supabase.co';
const keyToUse = supabaseAnonKey || 'public-anon-key';

export const supabase = createClient(urlToUse, keyToUse);

export const hasSupabaseConfig = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('xyzcompany')
);

