import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let adminClient: SupabaseClient | undefined;

function getAdminClient() {
  if (!supabaseUrl) {
    throw new Error('Brak NEXT_PUBLIC_SUPABASE_URL wymagany do operacji administracyjnych Supabase.');
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('Brak SUPABASE_SERVICE_ROLE_KEY wymagany do operacji administracyjnych Supabase.');
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getAdminClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});