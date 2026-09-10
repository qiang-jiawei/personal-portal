import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_TYPES: Record<string, string> = {
  "text/html": ".html",
  "application/xhtml+xml": ".html",
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.-]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "未找到文件" },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      // 允许扩展名为 .html/.htm 但 MIME 未识别的情况
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".html") && !lowerName.endsWith(".htm")) {
        return NextResponse.json(
          { success: false, error: "仅支持上传 HTML 文件" },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileExt =
      file.name.toLowerCase().endsWith(".htm") && !file.name.toLowerCase().endsWith(".html")
        ? ".htm"
        : ".html";
    const baseName = sanitizeFilename(file.name.replace(/\.(html?|HTML?)$/, ""));
    const timestamp = Date.now();
    const storagePath = `${timestamp}-${baseName}${fileExt}`;

    // 1) 尝试上传到 Storage
    let publicUrl: string;
    let storedPath = "";
    const storageRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/code-projects/${storagePath}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY || "",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ""}`,
          "x-upsert": "true",
          "Content-Type": file.type || "text/html",
        },
        body: arrayBuffer,
      }
    );

    if (storageRes.ok) {
      publicUrl = `${SUPABASE_URL}/storage/v1/object/public/code-projects/${storagePath}`;
      storedPath = storagePath;
    } else {
      const errText = await storageRes.text();
      return NextResponse.json(
        {
          success: false,
          error: `上传失败：${storageRes.status} - ${errText}（请确认已在 Supabase Storage 创建 code-projects 公开 bucket）`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: publicUrl, path: storedPath },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
