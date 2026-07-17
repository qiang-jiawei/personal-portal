import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import QRCode from "qrcode";
import { readFileSync } from "fs";
import { join } from "path";

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;
  if (!token) return null;

  const client = getSupabaseServiceClient();
  const { data: user } = await client
    .from("users")
    .select("id, phone, name, token_expires_at")
    .eq("login_token", token)
    .maybeSingle();

  if (!user) return null;
  if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { iou_id, document_type } = body;

    if (!iou_id || !document_type) {
      return NextResponse.json({ success: false, error: "参数不完整" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();

    // Get IOU data
    const { data: iou, error: iouError } = await client
      .from("ious")
      .select("id, document_no, verification_code, status, amount, description, borrower_phone, created_at")
      .eq("id", iou_id)
      .eq("borrower_phone", user.phone)
      .maybeSingle();

    if (iouError) throw new Error(`查询借据失败: ${iouError.message}`);
    if (!iou) {
      return NextResponse.json({ success: false, error: "借据不存在" }, { status: 404 });
    }

    // Get user name
    const { data: userData } = await client
      .from("users")
      .select("name")
      .eq("phone", user.phone)
      .maybeSingle();

    const borrowerName = userData?.name || user.phone;

    // Generate QR code (contains document_no and verification_code)
    const qrData = JSON.stringify({
      document_no: iou.document_no,
      verification_code: iou.verification_code,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Convert base64 to buffer
    const qrCodeBuffer = Buffer.from(qrCodeBase64.split(",")[1], "base64");

    // Load signature and seal images
    const publicDir = join(process.cwd(), "public");
    let signatureBuffer: Buffer | null = null;
    let sealBuffer: Buffer | null = null;

    try {
      signatureBuffer = readFileSync(join(publicDir, "signature.png"));
    } catch {
      console.warn("签名图片未找到，将使用占位符");
    }

    try {
      sealBuffer = readFileSync(join(publicDir, "seal.png"));
    } catch {
      console.warn("印章图片未找到，将使用占位符");
    }

    // Load Word template
    const templatePath = join(publicDir, "templates", "借据.docx");
    let templateBuffer: Buffer;

    try {
      templateBuffer = readFileSync(templatePath);
    } catch {
      return NextResponse.json(
        { success: false, error: "借据模板文件不存在" },
        { status: 500 }
      );
    }

    // Process template with docxtemplater
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare template data
    const templateData: Record<string, unknown> = {
      borrower_name: borrowerName,
      document_no: iou.document_no,
      verification_code: iou.verification_code,
      amount: iou.amount || "",
      description: iou.description || "",
      date: new Date(iou.created_at).toLocaleDateString("zh-CN"),
      qr_code: qrCodeBuffer,
      signature: signatureBuffer,
      seal: sealBuffer,
    };

    // Add document type specific data
    if (document_type === "valid") {
      templateData.document_title = "借 据";
      templateData.status_text = "有效";
    } else if (document_type === "expired") {
      templateData.document_title = "借款失效证明";
      templateData.status_text = "失效";
    } else if (document_type === "invalid") {
      templateData.document_title = "借据无效说明";
      templateData.status_text = "无效";
    }

    doc.setData(templateData);

    try {
      doc.render();
    } catch (error: unknown) {
      const e = error as { properties?: { errors?: Array<{ message?: string }> } };
      if (e.properties?.errors) {
        console.error("模板渲染错误:", e.properties.errors);
      }
      throw new Error("模板渲染失败");
    }

    const outZip = doc.getZip();
    const generatedDoc = outZip.generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Set filename based on document type
    const filenames: Record<string, string> = {
      valid: `借据_${iou.document_no}.docx`,
      expired: `借款失效证明_${iou.document_no}.docx`,
      invalid: `借据无效说明_${iou.document_no}.docx`,
    };

    const filename = filenames[document_type] || `借据_${iou.document_no}.docx`;

    return new NextResponse(new Uint8Array(generatedDoc), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("文档生成错误:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
