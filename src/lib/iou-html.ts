import QRCode from "qrcode";
import { loadSealBase64 } from "./pdf-utils";

/**
 * 生成借据 HTML（无背景图版本）
 */
export async function generateIOUHtml(
  iou: {
    document_no: string;
    borrower_name: string;
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
      position: relative;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .document-no {
      position: absolute;
      top: 30px;
      right: 40px;
      font-size: 12pt;
    }
    .title {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      color: #000;
      letter-spacing: 15px;
      margin-bottom: 5px;
    }
    .subtitle {
      font-family: "Monotype Corsiva", "Times New Roman", serif;
      font-size: 14pt;
      font-style: italic;
      color: #000;
    }
    .content {
      margin: 30px 0;
    }
    .borrower {
      text-align: center;
      margin-bottom: 20px;
    }
    .borrower-name {
      display: inline-block;
      border-bottom: 1px solid #000;
      padding: 0 20px;
      min-width: 120px;
      text-align: center;
    }
    .paragraph {
      text-indent: 2em;
      margin-bottom: 20px;
      line-height: 2.5;
    }
    .field {
      display: inline-block;
      border-bottom: 1px solid #000;
      padding: 0 10px;
      min-width: 60px;
      text-align: center;
    }
    .field-wide {
      min-width: 100px;
    }
    .signature {
      text-align: right;
      margin-top: 40px;
      position: relative;
      padding-right: 120px;
    }
    .signature-text {
      margin-bottom: 10px;
    }
    .seal {
      position: absolute;
      right: 0;
      top: 0;
      width: 100px;
      height: 100px;
      opacity: 0.9;
      z-index: 1;
    }
    .signature-date {
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      position: relative;
    }
    .qr-section {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-top: 10px;
    }
    .qr-code {
      width: 90px;
      height: 90px;
    }
    .verification-info {
      font-size: 12pt;
      line-height: 1.6;
      padding-top: 5px;
    }
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 16pt;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .print-button:hover {
      background: #1d4ed8;
    }
    .print-hint {
      position: fixed;
      bottom: 30px;
      right: 180px;
      font-size: 12pt;
      color: #666;
      z-index: 1000;
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
      我方于 <span class="field">${loanDate}</span> 年 <span class="field">${loanDate}</span> 月 <span class="field">${loanDate}</span> 日向您通过 <span class="field field-wide">${iou.lending_method || "微信"}</span> 借取人民币 <span class="field">${iou.amount || "0"}</span> 元（大写： <span class="field field-wide">${amountCapital}</span> ）。
    </div>

    <div class="paragraph">
      预计于 <span class="field">${repaymentDate}</span> 年 <span class="field">${repaymentDate}</span> 月通过原渠道进行偿还，具体请关注相关通知。
    </div>

    <div class="paragraph">
      感谢您的信任。
    </div>
  </div>

  <div class="signature">
    <div class="signature-text">强嘉伟（盖章）</div>
    <div class="signature-date">${signingDate} 年 ${signingDate} 月 ${signingDate} 日</div>
    <img src="${sealBase64}" alt="印章" class="seal">
  </div>

  <div class="footer">
    <div class="qr-section">
      <img src="${qrCodeDataUrl}" alt="核验二维码" class="qr-code">
      <div class="verification-info">
        <div>核验编码：${iou.verification_code || "N/A"}</div>
        <div>核验网址：www.jiaweiqiang.cn</div>
      </div>
    </div>
  </div>

  <div class="print-hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  <button class="print-button" onclick="window.print()">打印 / 保存为 PDF</button>
</body>
</html>`;
}

/**
 * 生成借款证明 HTML（无背景图版本）
 */
export async function generateProofHtml(
  iou: {
    document_no: string;
    borrower_name: string;
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

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借款证明 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 25mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "仿宋", "FangSong", "STFangsong", serif;
      font-size: 16pt;
      line-height: 2.2;
      color: #000;
      padding: 40px 50px;
      position: relative;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .document-no {
      position: absolute;
      top: 40px;
      right: 50px;
      font-size: 14pt;
    }
    .title {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      color: #000;
      letter-spacing: 10px;
      margin-bottom: 10px;
    }
    .content {
      margin: 40px 0;
    }
    .paragraph {
      text-indent: 2em;
      margin-bottom: 20px;
      line-height: 2.5;
    }
    .field {
      display: inline-block;
      border-bottom: 1px solid #000;
      padding: 0 10px;
      min-width: 60px;
      text-align: center;
    }
    .field-wide {
      min-width: 100px;
    }
    .signature {
      text-align: right;
      margin-top: 60px;
      position: relative;
    }
    .signature-text {
      margin-bottom: 10px;
    }
    .seal {
      position: absolute;
      right: 0;
      top: -20px;
      width: 120px;
      height: 120px;
      opacity: 0.85;
      z-index: 1;
    }
    .signature-date {
      margin-top: 20px;
    }
    .footer {
      margin-top: 80px;
      position: relative;
    }
    .qr-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 20px;
    }
    .qr-code {
      width: 100px;
      height: 100px;
    }
    .verification-info {
      font-size: 14pt;
      line-height: 1.8;
    }
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 16pt;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .print-button:hover {
      background: #1d4ed8;
    }
    .print-hint {
      position: fixed;
      bottom: 30px;
      right: 180px;
      font-size: 12pt;
      color: #666;
      z-index: 1000;
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
  </div>

  <div class="content">
    <div class="paragraph">
      兹证明：
    </div>

    <div class="paragraph">
      强嘉伟于 <span class="field">${loanDate}</span> 年 <span class="field">${loanDate}</span> 月 <span class="field">${loanDate}</span> 日通过 <span class="field field-wide">${iou.lending_method || "微信"}</span> 渠道向 <span class="field field-wide">${borrowerName}</span> 同志借取人民币 <span class="field">${iou.amount || "0"}</span> 元（大写： <span class="field field-wide">${amountCapital}</span> ），已于 <span class="field">${repaymentDate}</span> 年 <span class="field">${repaymentDate}</span> 月 <span class="field">${repaymentDate}</span> 日进行归还。
    </div>

    <div class="paragraph">
      特此证明。
    </div>
  </div>

  <div class="signature">
    <div class="signature-text">强嘉伟（盖章）</div>
    <img src="${sealBase64}" alt="印章" class="seal">
    <div class="signature-date">${signingDate} 年 ${signingDate} 月 ${signingDate} 日</div>
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
 * 生成借据无效说明 HTML（无背景图版本）
 */
export async function generateInvalidStatementHtml(
  iou: {
    document_no: string;
    verification_code?: string;
  },
  signingDate: string
): Promise<string> {
  const sealBase64 = await loadSealBase64("round-seal.png");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借据无效说明 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 25mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "仿宋", "FangSong", "STFangsong", serif;
      font-size: 16pt;
      line-height: 2.2;
      color: #000;
      padding: 40px 50px;
      position: relative;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .document-no {
      position: absolute;
      top: 40px;
      right: 50px;
      font-size: 14pt;
    }
    .title {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      color: #000;
      letter-spacing: 10px;
      margin-bottom: 10px;
    }
    .content {
      margin: 40px 0;
    }
    .paragraph {
      text-indent: 2em;
      margin-bottom: 20px;
      line-height: 2.5;
    }
    .signature {
      text-align: right;
      margin-top: 60px;
      position: relative;
    }
    .signature-text {
      margin-bottom: 10px;
    }
    .seal {
      position: absolute;
      right: 0;
      top: -20px;
      width: 120px;
      height: 120px;
      opacity: 0.85;
      z-index: 1;
    }
    .signature-date {
      margin-top: 20px;
    }
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 16pt;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .print-button:hover {
      background: #1d4ed8;
    }
    .print-hint {
      position: fixed;
      bottom: 30px;
      right: 180px;
      font-size: 12pt;
      color: #666;
      z-index: 1000;
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
    <img src="${sealBase64}" alt="印章" class="seal">
    <div class="signature-date">${signingDate} 年 ${signingDate} 月 ${signingDate} 日</div>
  </div>

  <div class="print-hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  <button class="print-button" onclick="window.print()">打印 / 保存为 PDF</button>
</body>
</html>`;
}
