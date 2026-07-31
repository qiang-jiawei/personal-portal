import { NextRequest, NextResponse } from "next/server";

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
    if (!await checkAdmin(request)) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const data = await fetchFromSupabase("/info_disclosures?select=*&order=created_at.desc");

    // 在代码中排序 is_pinned
    const sortedData = (data || []).sort((a: { is_pinned?: boolean }, b: { is_pinned?: boolean }) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

    return NextResponse.json({ success: true, data: sortedData });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, pdf_url, is_pinned } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "标题不能为空" }, { status: 400 });
    }

    const data = await fetchFromSupabase("/info_disclosures", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content?.trim() || "",
        pdf_url: pdf_url?.trim() || null,
        is_pinned: is_pinned || false,
        is_published: true,
      }),
    });

    await fetchFromSupabase("/audit_logs", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: null,
        action: "create_disclosure",
        target_type: "info_disclosure",
        target_id: data[0]?.id,
        detail: `创建信息公开：${title}`,
      }),
    });

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, pdf_url, is_pinned, is_published } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (pdf_url !== undefined) updateData.pdf_url = pdf_url?.trim() || null;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (is_published !== undefined) updateData.is_published = is_published;

    const data = await fetchFromSupabase(`/info_disclosures?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });

    await fetchFromSupabase("/audit_logs", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: null,
        action: "update_disclosure",
        target_type: "info_disclosure",
        target_id: id,
        detail: `更新信息公开：${title}`,
      }),
    });

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await checkAdmin(request)) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 ID" }, { status: 400 });
    }

    await fetchFromSupabase(`/info_disclosures?id=eq.${id}`, {
      method: "DELETE",
    });

    await fetchFromSupabase("/audit_logs", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: null,
        action: "delete_disclosure",
        target_type: "info_disclosure",
        target_id: id,
        detail: `删除信息公开`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
