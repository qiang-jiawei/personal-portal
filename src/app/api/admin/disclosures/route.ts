import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { checkAdmin } from "@/app/api/admin-auth/route";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("info_disclosures")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(`查询失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin(request);
    if (!adminCheck) {
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

    if (error) throw new Error(`创建失败: ${error.message}`);

    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_type: "admin",
      action: "create_disclosure",
      target_type: "info_disclosure",
      target_id: data.id,
      details: `创建信息公开: ${title}`,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, pdf_url, is_pinned, is_published } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少ID" }, { status: 400 });
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

    if (error) throw new Error(`更新失败: ${error.message}`);

    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_type: "admin",
      action: "update_disclosure",
      target_type: "info_disclosure",
      target_id: id,
      details: `更新信息公开: ${title}`,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少ID" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();
    const { error } = await client.from("info_disclosures").delete().eq("id", id);

    if (error) throw new Error(`删除失败: ${error.message}`);

    await client.from("audit_logs").insert({
      id: crypto.randomUUID(),
      user_type: "admin",
      action: "delete_disclosure",
      target_type: "info_disclosure",
      target_id: id,
      details: `删除信息公开`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
