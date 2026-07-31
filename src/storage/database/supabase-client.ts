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

function validateUrl(url: string): boolean {
  return url.startsWith('https://') && url.includes('.supabase.co');
}

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url) {
    throw new Error('SUPABASE_URL 未配置。请在 Vercel 环境变量中设置 SUPABASE_URL（格式：https://你的项目 ID.supabase.co）');
  }

  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY 未配置。请在 Vercel 环境变量中设置 SUPABASE_ANON_KEY。获取方式：Supabase 控制台 → Settings → API → anon/public key');
  }

  if (!validateUrl(url)) {
    throw new Error(`SUPABASE_URL 格式错误。正确格式：https://你的项目 ID.supabase.co，当前值：${url}`);
  }

  return createClient(url, anonKey);
}

export function getSupabaseServiceClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!url) {
    throw new Error('SUPABASE_URL 未配置。请在 Vercel 环境变量中设置 SUPABASE_URL（格式：https://你的项目 ID.supabase.co）');
  }

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 未配置。请在 Vercel 环境变量中设置 SUPABASE_SERVICE_ROLE_KEY。获取方式：Supabase 控制台 → Settings → API → Service Role Key（secret）');
  }

  if (!validateUrl(url)) {
    throw new Error(`SUPABASE_URL 格式错误。正确格式：https://你的项目 ID.supabase.co，当前值：${url}`);
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
