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
  const templatePath = join(process.cwd(), "public", filename);
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
      .select("id, document_no, verification_code, status, amount, description, borrower_phone, created_at")
      .eq("id", iou_id);
    
    if (!isAdmin) {
      query = query.eq("borrower_phone", user!.phone);
    }
    
    const { data: iou, error: iouError } = await query.maybeSingle();

    if (iouError) throw new Error(`查询借据失败：${iouError.message}`);
    if (!iou) {
      return NextResponse.json({ success: false, error: "借据不存在" }, { status: 404 });
    }

    // Use defaults - lending method and loan date will be added when database is updated
    const lendingMethod = "银行转账";
    const loanDate = new Date(iou.created_at);

    // Get user name
    const { data: userData } = await client
      .from("users")
      .select("name")
      .eq("phone", iou.borrower_phone)
      .maybeSingle();

    const borrowerName = userData?.name || iou.borrower_phone;
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

      // 编号 (top right) - fpdf(451.88, 120.87, 88, 12.67)
      page.drawText(iou.document_no, {
        x: 451.88,
        y: 708.35, // 841.89 - 120.87 - 12.67
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      // 同志 (borrower name) - fpdf(94.54, 297.53, 68, 14.67)
      page.drawText(borrowerName, {
        x: 94.54,
        y: 529.69, // 841.89 - 297.53 - 14.67
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 年 月 日 (loan date)
      const loanYear = loanDate.getFullYear();
      const loanMonth = loanDate.getMonth() + 1;
      const loanDay = loanDate.getDate();
      // 年 - fpdf(183.88, 360.87, 51.33, 14)
      page.drawText(loanYear.toString(), { x: 183.88, y: 467.02, size: 14, font, color: rgb(0, 0, 0) });
      // 月 - fpdf(253.21, 359.53, 40.67, 15.33)
      page.drawText(loanMonth.toString(), { x: 253.21, y: 467.03, size: 14, font, color: rgb(0, 0, 0) });
      // 日 - fpdf(309.21, 360.2, 36, 14)
      page.drawText(loanDay.toString(), { x: 309.21, y: 467.69, size: 14, font, color: rgb(0, 0, 0) });

      // 通过 (lending method) - fpdf(441.21, 360.2, 62.67, 14.67)
      page.drawText(lendingMethod, {
        x: 441.21,
        y: 467.02,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 人民币 (amount) - fpdf(186.54, 392.87, 50, 12.67)
      const amount = iou.amount || "0";
      page.drawText(amount, {
        x: 186.54,
        y: 436.35, // 841.89 - 392.87 - 12.67
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 大写 (capital amount) - fpdf(325.88, 386.87, 156.67, 18.67)
      const amountCapital = amountToChineseCapital(amount);
      page.drawText(amountCapital, {
        x: 325.88,
        y: 436.35, // 841.89 - 386.87 - 18.67
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 预计于 (repayment date)
      const repayYear = repaymentDate.getFullYear();
      const repayMonth = repaymentDate.getMonth() + 1;
      // 年 - fpdf(189.21, 420.87, 55.33, 15.33)
      page.drawText(repayYear.toString(), { x: 189.21, y: 405.69, size: 14, font, color: rgb(0, 0, 0) });
      // 月 - fpdf(269.21, 421.53, 41.33, 14.67)
      page.drawText(repayMonth.toString(), { x: 269.21, y: 405.69, size: 14, font, color: rgb(0, 0, 0) });

      // 签名处 (seal instead of signature) - fpdf(121.21, 572.2, 100, 102.67)
      if (sealImage) {
        page.drawImage(sealImage, {
          x: 121.21,
          y: 167.02, // 841.89 - 572.2 - 102.67
          width: 100,
          height: 102.67,
        });
      }

      // 日期 (signing date)
      const signYear = signingDate.getFullYear();
      const signMonth = signingDate.getMonth() + 1;
      const signDay = signingDate.getDate();
      // 年 - fpdf(332.3, 610.71, 40, 16.67)
      page.drawText(signYear.toString(), { x: 332.3, y: 214.51, size: 14, font, color: rgb(0, 0, 0) });
      // 月 - fpdf(388.96, 610.71, 25.33, 15.33)
      page.drawText(signMonth.toString(), { x: 388.96, y: 215.85, size: 14, font, color: rgb(0, 0, 0) });
      // 日 - fpdf(429.63, 611.38, 25.33, 14.67)
      page.drawText(signDay.toString(), { x: 429.63, y: 215.84, size: 14, font, color: rgb(0, 0, 0) });

      // QR code (above verification code) - fpdf(139.88, 682.87, 98, 12)
      const qrImage = await pdfDoc.embedPng(qrCodeBytes);
      const qrSize = 60;
      page.drawImage(qrImage, {
        x: 139.88,
        y: 171.02, // 841.89 - 682.87 - 12 + 20 (above verification code)
        width: qrSize,
        height: qrSize,
      });

      // 核验编码 - fpdf(139.88, 682.87, 98, 12)
      page.drawText(iou.verification_code, {
        x: 139.88,
        y: 147.02, // 841.89 - 682.87 - 12
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

    } else if (document_type === "expired") {
      // 借款证明 template
      const fontSize = 12;

      // 编号 - fpdf(460.04, 112.16, 80.67, 24.67)
      page.drawText(iou.document_no, {
        x: 460.04,
        y: 705.06, // 841.89 - 112.16 - 24.67
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      // 年 月 日 (loan date)
      const loanYear = loanDate.getFullYear();
      const loanMonth = loanDate.getMonth() + 1;
      const loanDay = loanDate.getDate();
      // 年 - fpdf(208.04, 324.16, 51.33, 20)
      page.drawText(loanYear.toString(), { x: 208.04, y: 497.73, size: 14, font, color: rgb(0, 0, 0) });
      // 月 - fpdf(283.38, 320.16, 42.67, 22.67)
      page.drawText(loanMonth.toString(), { x: 283.38, y: 499.06, size: 14, font, color: rgb(0, 0, 0) });
      // 日 - fpdf(344.71, 318.16, 44, 25.33)
      page.drawText(loanDay.toString(), { x: 344.71, y: 498.4, size: 14, font, color: rgb(0, 0, 0) });

      // 渠道 (lending method) - fpdf(444.04, 322.16, 54.67, 21.33)
      page.drawText(lendingMethod, {
        x: 444.04,
        y: 498.4,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 同志 (borrower name) - fpdf(167.38, 348.82, 77.33, 25.33)
      page.drawText(borrowerName, {
        x: 167.38,
        y: 467.74,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 人民币 (amount) - fpdf(383.38, 354.16, 69.33, 20)
      const amount = iou.amount || "0";
      page.drawText(amount, {
        x: 383.38,
        y: 467.73,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      // 大写 (capital amount) - fpdf(167.38, 384.82, 110.67, 20)
      const amountCapital = amountToChineseCapital(amount);
      page.drawText(amountCapital, {
        x: 167.38,
        y: 437.07,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 已于 年 月 日 (repayment date)
      const repayYear = repaymentDate.getFullYear();
      const repayMonth = repaymentDate.getMonth() + 1;
      const repayDay = repaymentDate.getDate();
      // 年 - fpdf(346.04, 383.49, 34.67, 20.67)
      page.drawText(repayYear.toString(), { x: 346.04, y: 437.73, size: 14, font, color: rgb(0, 0, 0) });
      // 月 - fpdf(405.38, 385.49, 27.33, 19.33)
      page.drawText(repayMonth.toString(), { x: 405.38, y: 437.07, size: 14, font, color: rgb(0, 0, 0) });
      // 日 - fpdf(452.71, 388.82, 34, 16)
      page.drawText(repayDay.toString(), { x: 452.71, y: 437.07, size: 14, font, color: rgb(0, 0, 0) });

      // 借据编号 - fpdf(245.38, 451.49, 110, 18)
      page.drawText(iou.document_no, {
        x: 245.38,
        y: 372.4,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 核验编码 - fpdf(141.38, 674.16, 96.67, 18)
      page.drawText(iou.verification_code, {
        x: 141.38,
        y: 149.73,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 还款渠道 - fpdf(215.38, 545.49, 137.33, 20)
      page.drawText(lendingMethod, {
        x: 215.38,
        y: 276.4,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 还款单号 (use verification code as placeholder) - fpdf(244.71, 512.82, 110.67, 22.67)
      page.drawText(iou.verification_code, {
        x: 244.71,
        y: 306.4,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 签名处 (seal) - fpdf(116.71, 606.82, 72.67, 72)
      if (sealImage) {
        page.drawImage(sealImage, {
          x: 116.71,
          y: 163.07, // 841.89 - 606.82 - 72
          width: 72.67,
          height: 72,
        });
      }

      // 日期 (signing date)
      const signYear = signingDate.getFullYear();
      const signMonth = signingDate.getMonth() + 1;
      const signDay = signingDate.getDate();
      // 年 - fpdf(324.04, 636.16, 38, 22)
      page.drawText(signYear.toString(), { x: 324.04, y: 183.73, size: 14, font, color: rgb(0, 0, 0) });
      // 月 - fpdf(378.71, 636.16, 24, 22)
      page.drawText(signMonth.toString(), { x: 378.71, y: 183.73, size: 14, font, color: rgb(0, 0, 0) });
      // 日 - fpdf(419.38, 638.82, 25.33, 22.67)
      page.drawText(signDay.toString(), { x: 419.38, y: 180.4, size: 14, font, color: rgb(0, 0, 0) });

      // QR code - above verification code
      const qrImage = await pdfDoc.embedPng(qrCodeBytes);
      const qrSize = 60;
      page.drawImage(qrImage, {
        x: 141.38,
        y: 169.73, // 841.89 - 674.16 - 18 + 20 (above verification code)
        width: qrSize,
        height: qrSize,
      });

      // 核验编码 (bottom) - fpdf(141.38, 674.16, 96.67, 18)
      page.drawText(iou.verification_code, {
        x: 141.38,
        y: 149.73,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

    } else if (document_type === "invalid") {
      // 借据无效情况说明 template - no fields to fill, just add seal below text
      if (sealImage) {
        // Place seal below the text content (centered, below text)
        page.drawImage(sealImage, {
          x: width / 2 - 50,
          y: 200, // Below text content
          width: 100,
          height: 100,
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
