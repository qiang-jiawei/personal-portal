import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { checkAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("consultations")
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
    const { consultation_id, reply } = body;
    const client = getSupabaseServiceClient();
    const { error } = await client
      .from("consultations")
      .update({ status: "replied", reply, replied_at: new Date().toISOString() })
      .eq("id", consultation_id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
