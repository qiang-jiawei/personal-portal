import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { checkAdmin } from "@/lib/auth";

// GET /api/admin/downloads - 获取所有下载文件（管理员）
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase 查询错误:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    console.error("获取下载列表异常:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/admin/downloads - 添加下载文件
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, file_url, file_size, file_type, description } = body;

    if (!title || !file_url) {
      return NextResponse.json({ success: false, error: "标题和文件 URL 不能为空" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("downloads")
      .insert({
        title,
        category: category || "其他",
        file_url,
        file_size: file_size || 0,
        file_type: file_type || "",
        description: description || "",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("添加下载文件异常:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/admin/downloads - 更新下载文件
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, category, file_url, file_size, file_type, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 ID" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("downloads")
      .update({
        title,
        category,
        file_url,
        file_size,
        file_type,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("更新下载文件异常:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/admin/downloads - 删除下载文件
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 ID" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("downloads").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("删除下载文件异常:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
