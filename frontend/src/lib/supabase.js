import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'http://localhost:3000', 
  supabaseServiceKey || 'dummy_key', 
  { auth: { autoRefreshToken: false, persistSession: false } }
);
