/**
 * 借据 HTML 模板生成
 * 严格保持 docx 模板的排版风格
 */

import { loadSealBase64 } from "./pdf-utils";
import QRCode from "qrcode";

/**
 * 生成固定宽度的填充内容（类似 Python 的 format）
 * @param text 填充内容
 * @param width 总宽度（字符数）
 * @returns 填充后的内容（不足部分用空格补齐）
 */
function padCenter(text: string, width: number): string {
  const len = text.length;
  if (len >= width) return text;
  const padding = width - len;
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * 生成借据 HTML
 */
export async function generateIOUHtml(
  iou: {
    document_no: string;
    borrower_name?: string;
    loan_date?: string;
    lending_method?: string;
    amount?: string;
    repayment_date?: string;
    verification_code?: string;
  },
  borrowerName: string,
  amountCapital: string,
  loanDate: string,
  repaymentDate: string,
  signingDate: string
): Promise<string> {
  const sealBase64 = await loadSealBase64("square-seal.png");
  const qrCodeDataUrl = await QRCode.toDataURL(
    `https://jiaweiqiang.cn/verify?code=${iou.verification_code}`,
    { width: 100, margin: 1 }
  );

  // 解析日期
  const loanDateObj = loanDate ? new Date(loanDate) : new Date();
  const repaymentDateObj = repaymentDate ? new Date(repaymentDate) : new Date();
  const signingDateObj = signingDate ? new Date(signingDate) : new Date();

  const loanYear = loanDateObj.getFullYear();
  const loanMonth = loanDateObj.getMonth() + 1;
  const loanDay = loanDateObj.getDate();
  const repaymentYear = repaymentDateObj.getFullYear();
  const repaymentMonth = repaymentDateObj.getMonth() + 1;
  const signingYear = signingDateObj.getFullYear();
  const signingMonth = signingDateObj.getMonth() + 1;
  const signingDay = signingDateObj.getDate();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借据 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "仿宋", "FangSong", "STFangsong", serif;
      font-size: 14pt;
      line-height: 2;
      color: #000;
      padding: 30px 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .document-no {
      text-align: right;
      font-size: 12pt;
      margin-bottom: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      letter-spacing: 8px;
      margin-bottom: 5px;
    }
    .subtitle {
      font-family: "Monotype Corsiva", "Times New Roman", serif;
      font-size: 14pt;
      font-style: italic;
      color: #333;
    }
    .content {
      margin-bottom: 40px;
    }
    .borrower {
      text-align: left;
      margin-bottom: 20px;
      font-size: 14pt;
    }
    .borrower-name {
      display: inline-block;
      min-width: 80px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 10px;
    }
    .paragraph {
      margin-bottom: 15px;
      text-indent: 2em;
      text-align: justify;
    }
    .field {
      display: inline-block;
      min-width: 60px;
      text-align: center;
      padding: 0 4px;
      vertical-align: bottom;
      line-height: 1.8;
      font-family: 'FangSong', '仿宋', serif;
    }
    .field-wide {
      min-width: 100px;
    }
    .signature {
      text-align: right;
      margin-top: 60px;
      margin-bottom: 40px;
      position: relative;
      padding-right: 100px;
    }
    .signature-text {
      margin-bottom: 10px;
      font-size: 14pt;
      position: relative;
      z-index: 1;
    }
    .signature-date {
      font-size: 14pt;
      position: relative;
      z-index: 1;
    }
    .seal {
      position: absolute;
      right: 30px;
      top: -10px;
      width: 100px;
      height: 100px;
      opacity: 0.85;
      z-index: -1;
    }
    .footer {
      margin-top: 40px;
      text-align: left;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    .qr-code {
      width: 90px;
      height: 90px;
      margin-left: 45px;
    }
    .verification-info {
      font-size: 12pt;
      line-height: 1.8;
    }
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 12px 24px;
      background: #257abe;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-button:hover {
      background: #1a5a8a;
    }
    .print-hint {
      position: fixed;
      bottom: 80px;
      right: 30px;
      font-size: 12px;
      color: #666;
      text-align: right;
      max-width: 200px;
    }
    @media print {
      .print-button, .print-hint {
        display: none;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="document-no">编号：${iou.document_no}</div>
  
  <div class="header">
    <div class="title">借 据</div>
    <div class="subtitle">Promissory note</div>
  </div>

  <div class="content">
    <div class="borrower">
      <span class="borrower-name">${borrowerName}</span> 同志：
    </div>

    <div class="paragraph">
      我方于 <span class="field">${padCenter(String(loanYear), 4)}</span> 年 <span class="field">${padCenter(String(loanMonth), 2)}</span> 月 <span class="field">${padCenter(String(loanDay), 2)}</span> 日向您通过 <span class="field field-wide">${padCenter(iou.lending_method || "微信", 4)}</span> 借取人民币 <span class="field">${padCenter(String(iou.amount || "0"), 6)}</span> 元（大写：<span class="field field-wide">${padCenter(amountCapital, 8)}</span>）。
    </div>

    <div class="paragraph">
      预计于 <span class="field">${padCenter(String(repaymentYear), 4)}</span> 年 <span class="field">${padCenter(String(repaymentMonth), 2)}</span> 月通过原渠道进行偿还，具体请关注相关通知。
    </div>

    <div class="paragraph">
      感谢您的信任。
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 60px;">
    <div class="footer" style="margin-top: 0;">
      <div class="qr-section">
        <img src="${qrCodeDataUrl}" alt="核验二维码" class="qr-code">
        <div class="verification-info">
          <div>核验编码：${iou.verification_code || "N/A"}</div>
          <div>核验网址：www.jiaweiqiang.cn</div>
        </div>
      </div>
    </div>
    <div class="signature">
      <img src="${sealBase64}" alt="印章" class="seal">
      <div class="signature-text">强嘉伟（盖章）</div>
      <div class="signature-date">${signingYear} 年 ${signingMonth} 月 ${signingDay} 日</div>
    </div>
  </div>

  <div class="print-hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  <button class="print-button" onclick="window.print()">打印 / 保存为 PDF</button>
</body>
</html>`;
}

/**
 * 生成借款证明 HTML
 */
export async function generateProofHtml(
  iou: {
    document_no: string;
    borrower_name?: string;
    loan_date?: string;
    lending_method?: string;
    amount?: string;
    repayment_date?: string;
    verification_code?: string;
  },
  borrowerName: string,
  amountCapital: string,
  loanDate: string,
  repaymentDate: string,
  signingDate: string
): Promise<string> {
  const sealBase64 = await loadSealBase64("round-seal.png");
  const qrCodeDataUrl = await QRCode.toDataURL(
    `https://jiaweiqiang.cn/verify?code=${iou.verification_code}`,
    { width: 100, margin: 1 }
  );

  // 解析日期
  const loanDateObj = loanDate ? new Date(loanDate) : new Date();
  const repaymentDateObj = repaymentDate ? new Date(repaymentDate) : new Date();
  const signingDateObj = signingDate ? new Date(signingDate) : new Date();

  const loanYear = loanDateObj.getFullYear();
  const loanMonth = loanDateObj.getMonth() + 1;
  const loanDay = loanDateObj.getDate();
  const repaymentYear = repaymentDateObj.getFullYear();
  const repaymentMonth = repaymentDateObj.getMonth() + 1;
  const repaymentDay = repaymentDateObj.getDate();
  const signingYear = signingDateObj.getFullYear();
  const signingMonth = signingDateObj.getMonth() + 1;
  const signingDay = signingDateObj.getDate();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借款证明 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "仿宋", "FangSong", "STFangsong", serif;
      font-size: 14pt;
      line-height: 2;
      color: #000;
      padding: 30px 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .document-no {
      text-align: right;
      font-size: 12pt;
      margin-bottom: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      letter-spacing: 8px;
      margin-bottom: 5px;
    }
    .subtitle {
      font-family: "Monotype Corsiva", "Times New Roman", serif;
      font-size: 14pt;
      font-style: italic;
      color: #333;
    }
    .content {
      margin-bottom: 40px;
    }
    .paragraph {
      margin-bottom: 15px;
      text-indent: 2em;
      text-align: justify;
    }
    .field {
      display: inline-block;
      min-width: 60px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 5px;
    }
    .field-wide {
      min-width: 100px;
    }
    .signature {
      text-align: right;
      margin-top: 60px;
      margin-bottom: 40px;
      position: relative;
      padding-right: 100px;
    }
    .signature-text {
      margin-bottom: 10px;
      font-size: 14pt;
    }
    .signature-date {
      font-size: 14pt;
    }
    .seal {
      position: absolute;
      right: 0;
      top: -10px;
      width: 100px;
      height: 100px;
      opacity: 0.85;
    }
    .footer {
      margin-top: 40px;
      text-align: left;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    .qr-code {
      width: 90px;
      height: 90px;
    }
    .verification-info {
      font-size: 12pt;
      line-height: 1.8;
    }
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 12px 24px;
      background: #257abe;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-button:hover {
      background: #1a5a8a;
    }
    .print-hint {
      position: fixed;
      bottom: 80px;
      right: 30px;
      font-size: 12px;
      color: #666;
      text-align: right;
      max-width: 200px;
    }
    @media print {
      .print-button, .print-hint {
        display: none;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="document-no">编号：${iou.document_no}</div>
  
  <div class="header">
    <div class="title">借款证明</div>
    <div class="subtitle">Loan Certificate</div>
  </div>

  <div class="content">
    <div class="paragraph">
      兹证明：
    </div>
    <div class="paragraph">
      强嘉伟于 <span class="field">${padCenter(String(loanYear), 4)}</span> 年 <span class="field">${padCenter(String(loanMonth), 2)}</span> 月 <span class="field">${padCenter(String(loanDay), 2)}</span> 日通过 <span class="field">${padCenter(iou.lending_method || "微信", 4)}</span> 渠道向 <span class="field">${padCenter(borrowerName, 6)}</span> 同志借取人民币 <span class="field">${padCenter(String(iou.amount || "0"), 6)}</span> 元（大写：<span class="field">${padCenter(amountCapital, 10)}</span>），已于 <span class="field">${padCenter(String(repaymentYear), 4)}</span> 年 <span class="field">${padCenter(String(repaymentMonth), 2)}</span> 月 <span class="field">${padCenter(String(repaymentDay), 2)}</span> 日进行归还。
    </div>
    <div class="paragraph">
      特此证明。
    </div>
  </div>

  <div class="signature">
    <div class="signature-text">强嘉伟（盖章）</div>
    <div class="signature-date">${signingYear} 年 ${signingMonth} 月 ${signingDay} 日</div>
    <img src="${sealBase64}" alt="印章" class="seal">
  </div>

  <div class="footer">
    <div class="qr-section">
      <img src="${qrCodeDataUrl}" alt="核验二维码" class="qr-code">
      <div class="verification-info">
        <div>核验编码：${iou.verification_code || "N/A"}</div>
        <div>核验网址：www.jiaweiqiang.cn</div>
        <div>联系方式：jiawei-qiang@foxmail.com</div>
      </div>
    </div>
  </div>

  <div class="print-hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  <button class="print-button" onclick="window.print()">打印 / 保存为 PDF</button>
</body>
</html>`;
}

/**
 * 生成借据无效说明 HTML
 */
export async function generateInvalidStatementHtml(
  iou: {
    document_no: string;
    verification_code?: string;
  },
  signingDate: string
): Promise<string> {
  const sealBase64 = await loadSealBase64("round-seal.png");

  const signingDateObj = signingDate ? new Date(signingDate) : new Date();
  const signingYear = signingDateObj.getFullYear();
  const signingMonth = signingDateObj.getMonth() + 1;
  const signingDay = signingDateObj.getDate();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借据无效说明 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "仿宋", "FangSong", "STFangsong", serif;
      font-size: 14pt;
      line-height: 2;
      color: #000;
      padding: 30px 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .document-no {
      text-align: right;
      font-size: 12pt;
      margin-bottom: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      letter-spacing: 4px;
      margin-bottom: 5px;
    }
    .content {
      margin-bottom: 40px;
    }
    .paragraph {
      margin-bottom: 15px;
      text-indent: 2em;
      text-align: justify;
    }
    .signature {
      text-align: right;
      margin-top: 60px;
      margin-bottom: 40px;
      position: relative;
      padding-right: 100px;
    }
    .signature-text {
      margin-bottom: 10px;
      font-size: 14pt;
    }
    .signature-date {
      font-size: 14pt;
    }
    .seal {
      position: absolute;
      right: 0;
      top: -10px;
      width: 100px;
      height: 100px;
      opacity: 0.85;
    }
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 12px 24px;
      background: #257abe;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-button:hover {
      background: #1a5a8a;
    }
    .print-hint {
      position: fixed;
      bottom: 80px;
      right: 30px;
      font-size: 12px;
      color: #666;
      text-align: right;
      max-width: 200px;
    }
    @media print {
      .print-button, .print-hint {
        display: none;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="document-no">编号：${iou.document_no}</div>
  
  <div class="header">
    <div class="title">借据无效说明</div>
  </div>

  <div class="content">
    <div class="paragraph">
      兹说明：编号为 ${iou.document_no} 的借据因故无效，特此声明。
    </div>
  </div>

  <div class="signature">
    <div class="signature-text">强嘉伟（盖章）</div>
    <div class="signature-date">${signingYear} 年 ${signingMonth} 月 ${signingDay} 日</div>
    <img src="${sealBase64}" alt="印章" class="seal">
  </div>

  <div class="print-hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  <button class="print-button" onclick="window.print()">打印 / 保存为 PDF</button>
</body>
</html>`;
}
