import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { generateIOUNumber } from "@/lib/pdf-utils";

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
    const { borrower_phone, amount, lending_method, loan_date } = body;
    if (!borrower_phone) {
      return NextResponse.json({ success: false, error: "请填写借款人手机号" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();

    // Auto-generate IOU number
    const document_no = await generateIOUNumber(client);

    const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Look up user by phone to set user_id
    const { data: userData } = await client
      .from("users")
      .select("id")
      .eq("phone", borrower_phone.trim())
      .maybeSingle();

    // Build insert data - only include fields that exist in database
    const insertData: any = {
      id: crypto.randomUUID(),
      borrower_phone: borrower_phone.trim(),
      user_id: userData?.id || null,
      document_no: document_no,
      verification_code: verificationCode,
      status: "valid",
      amount: amount || null,
    };

    // Try to add optional fields if they exist
    try {
      const { error: testError } = await client
        .from("ious")
        .select("lending_method")
        .limit(1);
      
      if (!testError) {
        insertData.lending_method = lending_method || "银行转账";
        insertData.loan_date = loan_date || new Date().toISOString();
      }
    } catch {
      // Fields don't exist, use defaults
    }

    const { error } = await client.from("ious").insert(insertData);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, document_no, verification_code: verificationCode });
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
