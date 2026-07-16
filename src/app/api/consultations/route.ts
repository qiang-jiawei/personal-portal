import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;
  if (!token) return null;

  const client = getSupabaseServiceClient();
  const { data: user, error } = await client
    .from("users")
    .select("id, phone, name, token_expires_at")
    .eq("login_token", token)
    .maybeSingle();

  if (error || !user) return null;

  if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) return null;

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("consultations")
      .select("id, title, content, contact, status, reply, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`查询失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, contact } = body;

    if (!title?.trim() || !content?.trim() || !contact?.trim()) {
      return NextResponse.json({ success: false, error: "所有字段不能为空" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();
    const { error } = await client.from("consultations").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      contact: contact.trim(),
    });

    if (error) throw new Error(`提交失败: ${error.message}`);

    // Log
    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      action: "create_consultation",
      target_type: "consultation",
      detail: `提交咨询: ${title.trim()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
