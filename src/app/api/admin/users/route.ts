import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("users")
      .select("id, phone, name, is_active, is_frozen, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });

    const body = await request.json();
    const { user_id, action } = body;
    const client = getSupabaseServiceClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (action === "freeze") updates.is_frozen = true;
    else if (action === "unfreeze") updates.is_frozen = false;
    else if (action === "deactivate") updates.is_active = false;

    const { error } = await client.from("users").update(updates).eq("id", user_id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

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
