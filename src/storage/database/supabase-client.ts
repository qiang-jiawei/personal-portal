import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';
}

function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  return createClient(url, anonKey);
}

export function getSupabaseServiceClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!url || !serviceKey) {
    throw new Error('Supabase service role environment variables not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
