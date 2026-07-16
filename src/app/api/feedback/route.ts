import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, contact } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ success: false, error: "反馈内容至少10个字符" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();
    const { error } = await client.from("feedback").insert({
      id: crypto.randomUUID(),
      type: type || "bug",
      content: content.trim(),
      contact: contact?.trim() || null,
    });

    if (error) throw new Error(`提交失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
