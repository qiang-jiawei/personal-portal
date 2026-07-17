import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';

  const urlOk = url.startsWith('https://') && url.includes('.supabase.co');
  const anonOk = anonKey.length > 10;
  const serviceOk = serviceKey.length > 10;

  return NextResponse.json({
    success: true,
    config: {
      SUPABASE_URL: url ? `${url.substring(0, 12)}...${url.substring(url.length - 4)}` : '(未设置)',
      SUPABASE_URL_valid: urlOk,
      SUPABASE_ANON_KEY_set: anonOk,
      SUPABASE_SERVICE_ROLE_KEY_set: serviceOk,
    },
  });
}
