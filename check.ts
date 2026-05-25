import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
supabase.from('transactions').select('*').eq('status', 'pending').then(r => console.log(JSON.stringify(r.data, null, 2)));
