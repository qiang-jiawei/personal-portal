import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return false;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  return token === Buffer.from(`${adminUser}:${adminPass}`).toString("base64");
}

export async function GET(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("ious")
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
    const { borrower_phone, document_no, amount } = body;
    if (!borrower_phone || !document_no) {
      return NextResponse.json({ success: false, error: "请填写完整信息" }, { status: 400 });
    }

    const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const client = getSupabaseClient();

    const { error } = await client.from("ious").insert({
      id: crypto.randomUUID(),
      borrower_phone: borrower_phone.trim(),
      document_no: document_no.trim(),
      verification_code: verificationCode,
      status: "valid",
      amount: amount || null,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, verification_code: verificationCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const body = await request.json();
    const { iou_id, status } = body;
    const client = getSupabaseClient();
    const { error } = await client
      .from("ious")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", iou_id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
