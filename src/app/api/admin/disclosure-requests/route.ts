import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

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
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("disclosure_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const body = await request.json();
    const { request_id, reply } = body;
    const client = getSupabaseServiceClient();
    const { error } = await client
      .from("disclosure_requests")
      .update({ status: "replied", reply, replied_at: new Date().toISOString() })
      .eq("id", request_id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
