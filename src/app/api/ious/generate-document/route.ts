import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFileSync } from "fs";
import { join } from "path";
import {
  amountToChineseCapital,
  generateIOUNumber,
  calculateRepaymentDate,
  formatDateChinese,
  formatDateShort,
} from "@/lib/pdf-utils";

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

// Load PDF template
function loadTemplate(documentType: string): Buffer {
  const templateMap: Record<string, string> = {
    valid: "借据.pdf",
    expired: "借款证明.pdf",
    invalid: "借据无效情况说明.pdf",
  };
  const filename = templateMap[documentType] || "借据.pdf";
  const templatePath = join(process.cwd(), "assets", filename);
  console.log("Loading template from:", templatePath);
  return readFileSync(templatePath);
}

// Load seal image
function loadSeal(documentType: string): Buffer | null {
  const sealMap: Record<string, string> = {
    valid: "square-seal.png", // 强嘉伟印
    expired: "round-seal.png", // 强嘉伟证明专用章
    invalid: "round-seal.png", // 强嘉伟证明专用章
  };
  const filename = sealMap[documentType];
  if (!filename) return null;

  const sealPath = join(process.cwd(), "assets", "seals", filename);
  console.log("Loading seal from:", sealPath);
  try {
    return readFileSync(sealPath);
  } catch {
    console.warn(`Seal image not found: ${sealPath}`);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is logged in or admin
    const user = await getUserFromToken(request);
    const isAdmin = await checkAdmin(request);
    
    if (!user && !isAdmin) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { iou_id, document_type } = body;

    if (!iou_id || !document_type) {
      return NextResponse.json({ success: false, error: "参数不完整" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();

    // Get IOU data - admin can access any IOU, regular users only their own
    let query = client
      .from("ious")
      .select("id, document_no, verification_code, status, amount, description, borrower_phone, lending_method, created_at")
      .eq("id", iou_id);
    
    if (!isAdmin) {
      query = query.eq("borrower_phone", user!.phone);
    }
    
    const { data: iou, error: iouError } = await query.maybeSingle();

    if (iouError) throw new Error(`查询借据失败：${iouError.message}`);
    if (!iou) {
      return NextResponse.json({ success: false, error: "借据不存在" }, { status: 404 });
    }

    // Get user name
    const { data: userData } = await client
      .from("users")
      .select("name")
      .eq("phone", iou.borrower_phone)
      .maybeSingle();

    const borrowerName = userData?.name || iou.borrower_phone;
    const loanDate = new Date(iou.created_at);
    const repaymentDate = calculateRepaymentDate(loanDate);
    const signingDate = new Date(); // Current date for signing

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

    // Load template
    const templateBytes = loadTemplate(document_type);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit);
    
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    // Load Chinese font
    const fontPath = join(process.cwd(), "public", "chinese-font.ttf");
    const fontBytes = readFileSync(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);

    // Load seal image
    const sealBytes = loadSeal(document_type);
    let sealImage: any = null;
    if (sealBytes) {
      try {
        sealImage = await pdfDoc.embedPng(sealBytes);
      } catch (e) {
        console.warn("Failed to embed seal image:", e);
      }
    }

    // Fill fields based on document type
    if (document_type === "valid") {
      // 借据 template
      const fontSize = 12;

      // 编号 (top right)
      page.drawText(iou.document_no, {
        x: 458,
        y: height - 135,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      // 同志 (borrower name)
      page.drawText(borrowerName, {
        x: 210,
        y: height - 310,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 我方于 (lender name - fixed as "强嘉伟")
      page.drawText("强嘉伟", {
        x: 172,
        y: height - 372,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 年 月 日 (loan date)
      const loanYear = loanDate.getFullYear();
      const loanMonth = loanDate.getMonth() + 1;
      const loanDay = loanDate.getDate();
      page.drawText(loanYear.toString(), { x: 195, y: height - 372, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(loanMonth.toString(), { x: 255, y: height - 372, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(loanDay.toString(), { x: 305, y: height - 372, size: 14, font, color: rgb(0, 0, 0) });

      // 通过 (lending method)
      const lendingMethod = iou.lending_method || "银行转账";
      page.drawText(lendingMethod, {
        x: 425,
        y: height - 372,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 人民币 (amount)
      const amount = iou.amount || "0";
      page.drawText(amount, {
        x: 172,
        y: height - 403,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 大写 (capital amount)
      const amountCapital = amountToChineseCapital(amount);
      page.drawText(amountCapital, {
        x: 315,
        y: height - 403,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 预计于 (repayment date)
      const repayYear = repaymentDate.getFullYear();
      const repayMonth = repaymentDate.getMonth() + 1;
      page.drawText(repayYear.toString(), { x: 195, y: height - 434, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(repayMonth.toString(), { x: 270, y: height - 434, size: 14, font, color: rgb(0, 0, 0) });

      // 签名处 (seal instead of signature)
      if (sealImage) {
        const sealSize = 80;
        page.drawImage(sealImage, {
          x: 350,
          y: height - 600,
          width: sealSize,
          height: sealSize,
        });
      }

      // 日期 (signing date)
      const signYear = signingDate.getFullYear();
      const signMonth = signingDate.getMonth() + 1;
      const signDay = signingDate.getDate();
      page.drawText(signYear.toString(), { x: 360, y: height - 620, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(signMonth.toString(), { x: 400, y: height - 620, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(signDay.toString(), { x: 435, y: height - 620, size: 14, font, color: rgb(0, 0, 0) });

      // QR code (above verification code)
      const qrImage = await pdfDoc.embedPng(qrCodeBytes);
      const qrSize = 80;
      page.drawImage(qrImage, {
        x: 90,
        y: height - 720,
        width: qrSize,
        height: qrSize,
      });

      // 核验编码
      page.drawText(iou.verification_code, {
        x: 140,
        y: height - 695,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

    } else if (document_type === "expired") {
      // 借款证明 template
      const fontSize = 12;

      // 编号
      page.drawText(iou.document_no, {
        x: 458,
        y: height - 135,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      // 强嘉伟 (lender name)
      page.drawText("强嘉伟", {
        x: 172,
        y: height - 310,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 年 月 日 (loan date)
      const loanYear = loanDate.getFullYear();
      const loanMonth = loanDate.getMonth() + 1;
      const loanDay = loanDate.getDate();
      page.drawText(loanYear.toString(), { x: 210, y: height - 310, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(loanMonth.toString(), { x: 260, y: height - 310, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(loanDay.toString(), { x: 300, y: height - 310, size: 14, font, color: rgb(0, 0, 0) });

      // 渠道 (lending method)
      const lendingMethod = iou.lending_method || "银行转账";
      page.drawText(lendingMethod, {
        x: 330,
        y: height - 310,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 同志 (borrower name)
      page.drawText(borrowerName, {
        x: 172,
        y: height - 340,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 人民币 (amount)
      const amount = iou.amount || "0";
      page.drawText(amount, {
        x: 330,
        y: height - 340,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 大写 (capital amount)
      const amountCapital = amountToChineseCapital(amount);
      page.drawText(amountCapital, {
        x: 210,
        y: height - 370,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 已于 年 月 日 (repayment date)
      const repayYear = repaymentDate.getFullYear();
      const repayMonth = repaymentDate.getMonth() + 1;
      const repayDay = repaymentDate.getDate();
      page.drawText(repayYear.toString(), { x: 330, y: height - 370, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(repayMonth.toString(), { x: 380, y: height - 370, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(repayDay.toString(), { x: 420, y: height - 370, size: 14, font, color: rgb(0, 0, 0) });

      // 借据编号
      page.drawText(iou.document_no, {
        x: 172,
        y: height - 420,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 核验编码
      page.drawText(iou.verification_code, {
        x: 172,
        y: height - 450,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 还款渠道
      page.drawText(lendingMethod, {
        x: 172,
        y: height - 480,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 还款单号 (use verification code as placeholder)
      page.drawText(iou.verification_code, {
        x: 172,
        y: height - 510,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 签名处 (seal)
      if (sealImage) {
        const sealSize = 80;
        page.drawImage(sealImage, {
          x: 350,
          y: height - 600,
          width: sealSize,
          height: sealSize,
        });
      }

      // 日期 (signing date)
      const signYear = signingDate.getFullYear();
      const signMonth = signingDate.getMonth() + 1;
      const signDay = signingDate.getDate();
      page.drawText(signYear.toString(), { x: 360, y: height - 620, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(signMonth.toString(), { x: 400, y: height - 620, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(signDay.toString(), { x: 435, y: height - 620, size: 14, font, color: rgb(0, 0, 0) });

      // QR code
      const qrImage = await pdfDoc.embedPng(qrCodeBytes);
      const qrSize = 80;
      page.drawImage(qrImage, {
        x: 90,
        y: height - 720,
        width: qrSize,
        height: qrSize,
      });

      // 核验编码 (bottom)
      page.drawText(iou.verification_code, {
        x: 140,
        y: height - 695,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

    } else if (document_type === "invalid") {
      // 借据无效情况说明 template - no fields to fill, just add seal below text
      if (sealImage) {
        const sealSize = 100;
        // Place seal below the text content
        page.drawImage(sealImage, {
          x: width / 2 - sealSize / 2,
          y: height - 550,
          width: sealSize,
          height: sealSize,
        });
      }
    }

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Set filename
    const filenames: Record<string, string> = {
      valid: `借据_${iou.document_no}.pdf`,
      expired: `借款证明_${iou.document_no}.pdf`,
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
