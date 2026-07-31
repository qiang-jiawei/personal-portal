import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;

export async function GET() {
  try {
    if (!SUPABASE_URL) {
      throw new Error("SUPABASE_URL 未配置");
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/honors?order=sort_order.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${SUPABASE_ANON_KEY || ""}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase API 错误：${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
