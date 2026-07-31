import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { downloads } from "@/storage/database/shared/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/downloads - 获取下载列表（支持分类筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const supabase = getSupabaseClient();

    let query = supabase.from("downloads").select("*");

    if (category && category !== "全部") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("查询下载列表失败:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("获取下载列表异常:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/downloads - 增加下载次数
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少参数" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 获取当前下载次数
    const { data: current, error: fetchError } = await supabase
      .from("downloads")
      .select("download_count")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    // 更新下载次数
    const { error: updateError } = await supabase
      .from("downloads")
      .update({ download_count: (current?.download_count || 0) + 1 })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("更新下载次数异常:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
