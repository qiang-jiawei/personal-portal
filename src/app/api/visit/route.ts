import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServiceClient();
    const today = new Date().toISOString().split("T")[0];

    // Try to update today's count
    const { data: existing, error: selectError } = await client
      .from("visit_stats")
      .select("id, visit_count, total_count")
      .eq("visit_date", today)
      .maybeSingle();

    if (selectError) throw new Error(`查询访问统计失败: ${selectError.message}`);

    let todayCount: number;
    let totalCount: number;

    if (existing) {
      todayCount = existing.visit_count + 1;
      totalCount = existing.total_count + 1;
      const { error: updateError } = await client
        .from("visit_stats")
        .update({ visit_count: todayCount, total_count: totalCount })
        .eq("id", existing.id);
      if (updateError) throw new Error(`更新访问统计失败: ${updateError.message}`);
    } else {
      todayCount = 1;
      // Get current total from the latest record
      const { data: latest, error: latestError } = await client
        .from("visit_stats")
        .select("total_count")
        .order("visit_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestError) throw new Error(`查询最新统计失败: ${latestError.message}`);
      totalCount = (latest?.total_count ?? 0) + 1;

      const { error: insertError } = await client
        .from("visit_stats")
        .insert({ id: crypto.randomUUID(), visit_date: today, visit_count: 1, total_count: totalCount });
      if (insertError) throw new Error(`插入访问统计失败: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, today_count: todayCount, total_count: totalCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = getSupabaseServiceClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: todayData, error: todayError } = await client
      .from("visit_stats")
      .select("visit_count, total_count")
      .eq("visit_date", today)
      .maybeSingle();

    if (todayError) throw new Error(`查询失败: ${todayError.message}`);

    const { data: latestData, error: latestError } = await client
      .from("visit_stats")
      .select("total_count")
      .order("visit_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw new Error(`查询失败: ${latestError.message}`);

    return NextResponse.json({
      success: true,
      today_count: todayData?.visit_count ?? 0,
      total_count: latestData?.total_count ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
