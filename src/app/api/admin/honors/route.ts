import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

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
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const data = await fetchFromSupabase("honors?order=sort_order.asc");
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, organization, date, category, sort_order } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "标题不能为空" }, { status: 400 });
    }

    const data = await fetchFromSupabase("honors", {
      method: "POST",
      body: { title, description: description || "", organization: organization || "", date: date || "", category: category || "其他", sort_order: sort_order || 0 },
    });

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, organization, date, category, sort_order } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 ID" }, { status: 400 });
    }

    const data = await fetchFromSupabase(`honors?id=eq.${id}`, {
      method: "PATCH",
      body: { title, description: description || "", organization: organization || "", date: date || "", category: category || "其他", sort_order: sort_order || 0 },
    });

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少 ID" }, { status: 400 });
    }

    await fetchFromSupabase(`honors?id=eq.${id}`, { method: "DELETE" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
