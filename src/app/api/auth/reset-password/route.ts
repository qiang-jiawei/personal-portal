import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, new_password } = body;

    if (!phone || !new_password) {
      return NextResponse.json({ success: false, error: "请填写完整信息" }, { status: 400 });
    }

    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, error: "手机号格式不正确" }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ success: false, error: "密码至少6位" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const passwordHash = Buffer.from(new_password).toString("base64");

    const { data: user, error: findError } = await client
      .from("users")
      .select("id, is_active")
      .eq("phone", phone)
      .maybeSingle();

    if (findError) throw new Error(`查询失败: ${findError.message}`);
    if (!user) {
      return NextResponse.json({ success: false, error: "该手机号未注册" }, { status: 404 });
    }
    if (!user.is_active) {
      return NextResponse.json({ success: false, error: "账号已注销" }, { status: 403 });
    }

    const { error: updateError } = await client
      .from("users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) throw new Error(`更新失败: ${updateError.message}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
