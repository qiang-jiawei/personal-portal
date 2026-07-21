import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFileSync, existsSync } from "fs";
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
      // === 借据模板（15 个字段） ===
      // 使用 pdfjs 坐标（Y 轴从下到上）

      // 1. 编号 - 右上角
      page.drawText(iou.document_no, {
        x: 451.88,
        y: 708.35,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 2. 借款人姓名
      page.drawText(borrowerName, {
        x: 94.54,
        y: 509.69,  // 借款人姓名
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 3. 借款年
      page.drawText(loanDate.getFullYear().toString(), {
        x: 183.88,
        y: 447.02,  // 借款年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 4. 借款月
      page.drawText((loanDate.getMonth() + 1).toString(), {
        x: 253.21,
        y: 447.03,  // 借款月
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 5. 借款日
      page.drawText(loanDate.getDate().toString(), {
        x: 309.21,
        y: 447.69,  // 借款日
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 6. 出借方式
      page.drawText(lendingMethod, {
        x: 441.21,
        y: 447.02,  // 借款年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 7. 金额数字
      const amount = iou.amount || "0";
      page.drawText(amount, {
        x: 186.54,
        y: 416.35,  // 金额数字
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 8. 金额大写
      const amountCapital = amountToChineseCapital(amount);
      page.drawText(amountCapital, {
        x: 325.88,
        y: 416.35,  // 金额数字
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 9. 还款年
      page.drawText(repaymentDate.getFullYear().toString(), {
        x: 189.21,
        y: 385.69,  // 还款年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 10. 还款月
      page.drawText((repaymentDate.getMonth() + 1).toString(), {
        x: 269.21,
        y: 385.69,  // 还款年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 11. 签署年
      page.drawText(signingDate.getFullYear().toString(), {
        x: 332.3,
        y: 194.51,  // 签署年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 12. 签署月
      page.drawText((signingDate.getMonth() + 1).toString(), {
        x: 388.96,
        y: 195.85,  // 签署月
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 13. 签署日
      page.drawText(signingDate.getDate().toString(), {
        x: 429.63,
        y: 195.84,  // 签署日
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 14. 核验编码
      page.drawText(iou.verification_code, {
        x: 139.88,
        y: 127.02,  // 核验编码
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      // 15. 印章 - 方形章
      const stampPath = join(process.cwd(), "public/square-seal.png");
      if (existsSync(stampPath)) {
        const stampBytes = readFileSync(stampPath);
        const stampImage = await pdfDoc.embedPng(stampBytes);
        page.drawImage(stampImage, {
          x: 121.21,
          y: 147.02,  // 印章
          width: 100,
          height: 102.67,
        });
      }

      // QR code - 核验编码上方
      const qrImage = await pdfDoc.embedPng(qrCodeBytes);
      const qrSize = 50;
      page.drawImage(qrImage, {
        x: 139.88,
        y: 151.02,  // QR 码
        width: qrSize,
        height: qrSize,
      });

    } else if (document_type === "expired") {
      // === 借款证明模板（新版 - 16 个字段） ===
      // 使用 pdfjs 坐标（Y 轴从下到上，与 pdf-lib 一致）

      // 1. 编号 - 右上角
      page.drawText(iou.document_no, {
        x: 452.71,
        y: 725.84,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 2. 借款年
      page.drawText(loanDate.getFullYear().toString(), {
        x: 202.04,
        y: 497.51,  // 借款年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 3. 借款月
      page.drawText((loanDate.getMonth() + 1).toString(), {
        x: 285.38,
        y: 498.84,  // 借款月
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 4. 借款日
      page.drawText(loanDate.getDate().toString(), {
        x: 348.71,
        y: 500.18,  // 借款日
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 5. 出借方式
      page.drawText(lendingMethod, {
        x: 446.71,
        y: 500.18,  // 借款日
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 6. 借款人姓名
      page.drawText(borrowerName, {
        x: 144.71,
        y: 470.18,  // 借款人姓名
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 7. 金额数字
      const amount = iou.amount || "0";
      page.drawText(amount, {
        x: 363.38,
        y: 470.18,  // 借款人姓名
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 8. 金额大写
      const amountCapital = amountToChineseCapital(amount);
      page.drawText(amountCapital, {
        x: 152.04,
        y: 438.84,  // 金额大写
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 9. 还款年
      page.drawText(repaymentDate.getFullYear().toString(), {
        x: 342.04,
        y: 437.51,  // 还款年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 10. 还款月
      page.drawText((repaymentDate.getMonth() + 1).toString(), {
        x: 400.71,
        y: 438.18,  // 还款月
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 11. 还款日
      page.drawText(repaymentDate.getDate().toString(), {
        x: 454.71,
        y: 439.51,  // 还款日
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 12. 签署年
      page.drawText(signingDate.getFullYear().toString(), {
        x: 317.38,
        y: 280.84,  // 签署年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 13. 签署月
      page.drawText((signingDate.getMonth() + 1).toString(), {
        x: 377.38,
        y: 280.84,  // 签署年
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 14. 签署日
      page.drawText(signingDate.getDate().toString(), {
        x: 420.71,
        y: 281.51,  // 签署日
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // 15. 核验编码
      page.drawText(iou.verification_code, {
        x: 141.38,
        y: 241.51,  // 核验编码
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      // 16. 印章 - 圆形章
      const stampPath = join(process.cwd(), "public/round-seal.png");
      if (existsSync(stampPath)) {
        const stampBytes = readFileSync(stampPath);
        const stampImage = await pdfDoc.embedPng(stampBytes);
        page.drawImage(stampImage, {
          x: 123.38,
          y: 334.84,  // 印章
          width: 86,
          height: 86.67,
        });
      }

      // QR code - 核验编码、核验网址、联系方式上方，大小 2.8cm (79pt)
      const qrImage = await pdfDoc.embedPng(qrCodeBytes);
      const qrSize = 79;
      page.drawImage(qrImage, {
        x: 110,  // 向右挪动 3/4d (60pt)
        y: 260,  // 向下挪动 3/4d (60pt)
        width: qrSize,
        height: qrSize,
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
