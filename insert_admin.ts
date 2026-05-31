import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@admin.com';

async function run() {
  console.log(`Menyiapkan ${ADMIN_EMAIL} sebagai admin...`);
  
  // Mencari user berdasarkan email jika ada (untuk mendapatkan ID-nya)
  // Cara termudah adalah mengupdate langsung table profiles:
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', ADMIN_EMAIL)
    .select();

  if (error) {
    console.error('Gagal mengupdate role:', error);
  } else if (!data || data.length === 0) {
    console.warn('⚠️ User dengan email tersebut belum mendaftar. Silakan daftar/login dulu di UI lalu jalankan lagi script ini.');
  } else {
    console.log('✅ Berhasil set admin:', data[0].email);
  }
}

run();
