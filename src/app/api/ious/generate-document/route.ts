import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";
import QRCode from "qrcode";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  amountToChineseCapital,
  calculateRepaymentDate,
  loadSealBase64,
  loadBackgroundBase64,
} from "@/lib/pdf-utils";
import { getUserFromToken, checkAdmin } from "@/lib/auth";
import {
  generateIOUHtml,
  generateProofHtml,
  generateInvalidStatementHtml,
} from "@/lib/iou-html";

export async function POST(request: NextRequest) {
  try {
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

    let query = client
      .from("ious")
      .select("id, document_no, verification_code, status, amount, description, borrower_phone, created_at, lending_method, loan_date")
      .eq("id", iou_id);
    
    if (!isAdmin) {
      query = query.eq("borrower_phone", user!.phone);
    }
    
    const { data: iou, error: iouError } = await query.maybeSingle();

    if (iouError) throw new Error(`查询借据失败：${iouError.message}`);
    if (!iou) {
      return NextResponse.json({ success: false, error: "借据不存在" }, { status: 404 });
    }

    const lendingMethod = iou.lending_method || "微信";
    const loanDate = iou.loan_date ? new Date(iou.loan_date) : new Date(iou.created_at);

    const { data: userData } = await client
      .from("users")
      .select("name")
      .eq("phone", iou.borrower_phone)
      .maybeSingle();

    const borrowerName = userData?.name || iou.borrower_phone;
    const repaymentDate = calculateRepaymentDate(loanDate);
    const signingDate = new Date();

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

    // Load seal and background images
    const sealMap: Record<string, string> = {
      valid: "square-seal.png",
      expired: "round-seal.png",
      invalid: "round-seal.png",
    };
    const sealBase64 = await loadSealBase64(sealMap[document_type] || "square-seal.png");
    const backgroundBase64 = await loadBackgroundBase64("借据背景.png");

    // Generate HTML based on document type
    let html: string;
    let filename: string;

    if (document_type === "valid") {
      html = await generateIOUHtml(iou, borrowerName, amountToChineseCapital(iou.amount || "0"), loanDate, repaymentDate, signingDate);
      filename = `借据_${iou.document_no}.html`;
    } else if (document_type === "expired") {
      html = await generateProofHtml({
        document_no: iou.document_no,
        borrower_name: borrowerName,
        loan_date: loanDate,
        lending_method: lendingMethod,
        amount: iou.amount || "0",
        amount_capital: amountToChineseCapital(iou.amount || "0"),
        repayment_date: repaymentDate,
        signing_date: signingDate,
        verification_code: iou.verification_code,
      });
      filename = `借款证明_${iou.document_no}.html`;
    } else if (document_type === "invalid") {
      html = await generateInvalidStatementHtml(iou, signingDate);
      filename = `借据无效说明_${iou.document_no}.html`;
    } else {
      return NextResponse.json({ success: false, error: "无效的文档类型" }, { status: 400 });
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("HTML 生成错误:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
