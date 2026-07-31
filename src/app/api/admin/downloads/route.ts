import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 直接使用 fetch 调用 PostgREST API，绕过 supabase-js 的 schema cache
async function fetchFromSupabase(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API 错误：${response.status} - ${error}`);
  }

  return response.json();
}

// GET /api/admin/downloads - 获取所有下载文件（管理员）
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const data = await fetchFromSupabase("/downloads?select=*&order=created_at.desc");

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

    const data = await fetchFromSupabase("/downloads", {
      method: "POST",
      body: JSON.stringify({
        title,
        category: category || "其他",
        file_url,
        file_size: file_size || 0,
        file_type: file_type || "",
        description: description || "",
      }),
    });

    return NextResponse.json({ success: true, data: data[0] });
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

    const data = await fetchFromSupabase(`/downloads?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title,
        category,
        file_url,
        file_size,
        file_type,
        description,
        updated_at: new Date().toISOString(),
      }),
    });

    return NextResponse.json({ success: true, data: data[0] });
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

    await fetchFromSupabase(`/downloads?id=eq.${id}`, {
      method: "DELETE",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("删除下载文件异常:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
