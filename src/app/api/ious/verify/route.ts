import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_no, verification_code } = body;

    if (!document_no?.trim() || !verification_code?.trim()) {
      return NextResponse.json({ success: false, message: "请填写完整信息" }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Find matching IOU
    const { data: iou, error } = await client
      .from("ious")
      .select("id, document_no, verification_code, status")
      .eq("document_no", document_no.trim())
      .eq("verification_code", verification_code.trim())
      .maybeSingle();

    if (error) throw new Error(`查询失败: ${error.message}`);

    let success = false;
    let message = "";

    if (!iou) {
      message = "编号或核验码不匹配";
    } else if (iou.status !== "valid") {
      message = `单据已${iou.status === "expired" ? "失效" : "无效"}，核验失败`;
    } else {
      success = true;
      message = "核验成功，单据信息匹配";
    }

    // Record verification
    await client.from("verification_records").insert({
      id: crypto.randomUUID(),
      iou_id: iou?.id || "unknown",
      document_no: document_no.trim(),
      verification_code: verification_code.trim(),
      result: success ? "success" : "failed",
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    });

    return NextResponse.json({ success, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
