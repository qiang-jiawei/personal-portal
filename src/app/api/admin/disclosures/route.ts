import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

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

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("info_disclosures")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(`查询失败：${error.message}`);

    return NextResponse.json({ success: true, data });
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

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("info_disclosures")
      .insert({
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content?.trim() || "",
        pdf_url: pdf_url?.trim() || null,
        is_pinned: is_pinned || false,
        is_published: true,
      })
      .select()
      .single();

    if (error) throw new Error(`创建失败：${error.message}`);

    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_id: null,
      action: "create_disclosure",
      target_type: "info_disclosure",
      target_id: data.id,
      detail: `创建信息公开：${title}`,
    });

    return NextResponse.json({ success: true, data });
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

    const client = getSupabaseServiceClient();
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (pdf_url !== undefined) updateData.pdf_url = pdf_url?.trim() || null;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (is_published !== undefined) updateData.is_published = is_published;

    const { data, error } = await client
      .from("info_disclosures")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`更新失败：${error.message}`);

    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_id: null,
      action: "update_disclosure",
      target_type: "info_disclosure",
      target_id: id,
      detail: `更新信息公开：${title}`,
    });

    return NextResponse.json({ success: true, data });
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

    const client = getSupabaseServiceClient();
    const { error } = await client.from("info_disclosures").delete().eq("id", id);

    if (error) throw new Error(`删除失败：${error.message}`);

    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_id: null,
      action: "delete_disclosure",
      target_type: "info_disclosure",
      target_id: id,
      detail: `删除信息公开`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
