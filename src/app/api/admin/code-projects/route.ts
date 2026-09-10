import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

async function fetchFromSupabase(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
) {
  const { method = "GET", body } = options;

  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY || "",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ""}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase API 错误：${res.status} - ${text}`);
  }

  if (method === "DELETE") return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const data = await fetchFromSupabase(
      "code_projects?order=sort_order.asc,created_at.desc"
    );
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      file_url,
      file_path,
      tags,
      sort_order,
      is_active,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "标题不能为空" },
        { status: 400 }
      );
    }
    if (!file_url) {
      return NextResponse.json(
        { success: false, error: "请先上传 HTML 文件" },
        { status: 400 }
      );
    }

    const data = await fetchFromSupabase("code_projects", {
      method: "POST",
      body: {
        title,
        description: description || "",
        file_url,
        file_path: file_path || "",
        tags: tags || "",
        sort_order: typeof sort_order === "number" ? sort_order : 0,
        is_active: is_active === false ? false : true,
      },
    });

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      file_url,
      file_path,
      tags,
      sort_order,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少 ID" },
        { status: 400 }
      );
    }

    const updateBody: Record<string, unknown> = {};
    if (title !== undefined) updateBody.title = title;
    if (description !== undefined) updateBody.description = description;
    if (file_url !== undefined) updateBody.file_url = file_url;
    if (file_path !== undefined) updateBody.file_path = file_path;
    if (tags !== undefined) updateBody.tags = tags;
    if (sort_order !== undefined)
      updateBody.sort_order = typeof sort_order === "number" ? sort_order : 0;
    if (is_active !== undefined) updateBody.is_active = is_active;

    const data = await fetchFromSupabase(`code_projects?id=eq.${id}`, {
      method: "PATCH",
      body: updateBody,
    });

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少 ID" },
        { status: 400 }
      );
    }

    await fetchFromSupabase(`code_projects?id=eq.${id}`, { method: "DELETE" });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
