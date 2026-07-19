import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";

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
    const date = new Date(iou.created_at).toLocaleDateString("zh-CN");

    // Generate QR code
    const qrData = JSON.stringify({
      document_no: iou.document_no,
      verification_code: iou.verification_code,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const qrCodeBytes = Buffer.from(qrCodeBase64.split(",")[1], "base64");

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    // Load Chinese font
    const fontUrl = new URL("../../../public/chinese-font.ttf", import.meta.url);
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);
    const boldFont = await pdfDoc.embedFont(fontBytes);

    // Title based on document type
    let title = "借 据";
    let statusText = "有效";
    if (document_type === "expired") {
      title = "借款失效证明";
      statusText = "失效";
    } else if (document_type === "invalid") {
      title = "借据无效说明";
      statusText = "无效";
    }

    // Draw title
    page.drawText(title, {
      x: width / 2 - 60,
      y: height - 80,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw content
    const lineHeight = 30;
    let y = height - 140;

    const drawLine = (label: string, value: string) => {
      page.drawText(label, {
        x: 60,
        y,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(value, {
        x: 160,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    };

    drawLine("借据编号：", iou.document_no);
    drawLine("借款人：", borrowerName);
    drawLine("金 额：", iou.amount || "");
    drawLine("核验码：", iou.verification_code);
    drawLine("日 期：", date);
    drawLine("状 态：", statusText);

    if (iou.description) {
      y -= 10;
      page.drawText("备注说明：", {
        x: 60,
        y,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 25;
      page.drawText(iou.description, {
        x: 60,
        y,
        size: 11,
        font,
        color: rgb(0, 0, 0),
        maxWidth: width - 120,
      });
    }

    // Draw QR code
    const qrImage = await pdfDoc.embedPng(qrCodeBytes);
    const qrSize = 100;
    page.drawImage(qrImage, {
      x: width - qrSize - 60,
      y: 100,
      width: qrSize,
      height: qrSize,
    });

    page.drawText("扫码核验", {
      x: width - qrSize - 60 + 20,
      y: 80,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Draw footer
    page.drawText("本文书由系统自动生成，具有法律效力", {
      x: 60,
      y: 50,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Set filename
    const filenames: Record<string, string> = {
      valid: `借据_${iou.document_no}.pdf`,
      expired: `借款失效证明_${iou.document_no}.pdf`,
      invalid: `借据无效说明_${iou.document_no}.pdf`,
    };
    const filename = filenames[document_type] || `借据_${iou.document_no}.pdf`;

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PDF 生成错误:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
