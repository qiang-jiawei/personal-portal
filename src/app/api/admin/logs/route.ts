import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get("admin_session")?.value;
  if (!session) return false;
  try {
    const decoded = atob(session);
    const parts = decoded.split(":");
    if (parts.length !== 2) return false;
    const [username] = parts;
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    return username === adminUser;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('[Admin Logs API Error]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
