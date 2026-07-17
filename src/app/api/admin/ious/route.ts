import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return false;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  return token === Buffer.from(`${adminUser}:${adminPass}`).toString("base64");
}

export async function GET(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("ious")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Batch fetch user names
    const phoneList = [...new Set((data || []).map((item: any) => item.borrower_phone).filter(Boolean))];
    let userMap: Record<string, string> = {};
    if (phoneList.length > 0) {
      const { data: users } = await client
        .from("users")
        .select("phone, name")
        .in("phone", phoneList);
      if (users) {
        userMap = Object.fromEntries(users.map((u: any) => [u.phone, u.name || ""]));
      }
    }

    const enriched = (data || []).map((item: any) => ({
      ...item,
      borrower_name: userMap[item.borrower_phone] || null,
    }));
    return NextResponse.json({ success: true, data: enriched });
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
    const client = getSupabaseServiceClient();

    // Look up user by phone to set user_id
    const { data: userData } = await client
      .from("users")
      .select("id")
      .eq("phone", borrower_phone.trim())
      .maybeSingle();

    const { error } = await client.from("ious").insert({
      id: crypto.randomUUID(),
      borrower_phone: borrower_phone.trim(),
      user_id: userData?.id || null,
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
    const client = getSupabaseServiceClient();
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
