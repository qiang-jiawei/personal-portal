import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { checkAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // 验证管理员权限
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "未选择文件" }, { status: 400 });
    }

    // 检查文件大小（最大 50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "文件大小不能超过 50MB" }, { status: 400 });
    }

    // 生成唯一文件名
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 上传到 Supabase Storage
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from("downloads")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("上传失败:", error);
      return NextResponse.json({ success: false, error: "上传失败: " + error.message }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from("downloads")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: data.path,
    });
  } catch (error) {
    console.error("上传异常:", error);
    return NextResponse.json(
      { success: false, error: "上传异常: " + (error as Error).message },
      { status: 500 }
    );
  }
}
