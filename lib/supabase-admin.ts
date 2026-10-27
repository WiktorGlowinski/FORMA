import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dpmmxyggsuiwmgupibpo.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('KRYTYCZNY BLAD: Brak SUPABASE_SERVICE_ROLE_KEY w pliku .env.local!');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});