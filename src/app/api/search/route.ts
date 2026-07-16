import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ success: true, data: [] });
    }

    const client = getSupabaseServiceClient();
    const results: { type: string; title: string; href: string }[] = [];

    // Search notices
    const { data: notices, error: noticesError } = await client
      .from("notices")
      .select("id, title")
      .eq("is_published", true)
      .ilike("title", `%${q}%`)
      .limit(10);

    if (!noticesError && notices) {
      results.push(...notices.map((n) => ({ type: "通知公告", title: n.title, href: "/notices" })));
    }

    // Search info disclosures
    const { data: disclosures, error: disclosuresError } = await client
      .from("info_disclosures")
      .select("id, title")
      .eq("is_published", true)
      .ilike("title", `%${q}%`)
      .limit(10);

    if (!disclosuresError && disclosures) {
      results.push(...disclosures.map((d) => ({ type: "信息公开", title: d.title, href: "/disclosure" })));
    }

    // Add static results for consultation and IOUs (require login)
    if ("咨询".includes(q) || "consultation".includes(q.toLowerCase())) {
      results.push({ type: "服务", title: "在线咨询", href: "/service/consultation" });
    }
    if ("借据".includes(q) || "财务".includes(q) || "IOU".includes(q.toUpperCase())) {
      results.push({ type: "服务", title: "借据查询", href: "/service/finance" });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
