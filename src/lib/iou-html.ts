import { createCanvas } from 'canvas';
import QRCode from 'qrcode';
import { loadSealBase64, loadBackgroundBase64 } from '@/lib/pdf-utils';

// 生成 QR 码 base64
async function generateQRCodeBase64(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 100,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return dataUrl;
  } catch {
    return '';
  }
}

// 生成借据 HTML
export async function generateIOUHtml(
  iou: any,
  borrowerName: string,
  amountCapital: string,
  loanDate: Date,
  repaymentDate: Date,
  signingDate: Date
): Promise<string> {
  const verificationUrl = `https://www.jiaweiqiang.cn/verify/${iou.verification_code}`;
  const qrCodeBase64 = await generateQRCodeBase64(verificationUrl);
  const sealBase64 = await loadSealBase64('square-seal.png');
  const backgroundBase64 = await loadBackgroundBase64('借据背景.png');

  const loanYear = loanDate.getFullYear().toString();
  const loanMonth = (loanDate.getMonth() + 1).toString();
  const loanDay = loanDate.getDate().toString();
  const repaymentYear = repaymentDate.getFullYear().toString();
  const repaymentMonth = (repaymentDate.getMonth() + 1).toString();
  const signingYear = signingDate.getFullYear().toString();
  const signingMonth = (signingDate.getMonth() + 1).toString();
  const signingDay = signingDate.getDate().toString();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借据 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "FangSong", "仿宋", "STFangsong", serif;
      font-size: 16pt;
      line-height: 2;
      color: #000;
      background: #fff;
    }
    
    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 25mm;
      overflow: hidden;
    }
    
    /* 背景图 */
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    
    .background img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    /* 内容层 */
    .content {
      position: relative;
      z-index: 1;
    }
    
    /* 编号 */
    .document-no {
      text-align: right;
      font-size: 12pt;
      margin-bottom: 30px;
      font-family: "SimSun", "宋体", serif;
    }
    
    /* 标题 */
    .title {
      text-align: center;
      margin: 40px 0 20px;
    }
    
    .title h1 {
      font-family: "SimHei", "黑体", sans-serif;
      font-size: 48pt;
      font-weight: bold;
      letter-spacing: 20px;
      color: #000;
      margin-bottom: 10px;
    }
    
    .title .subtitle {
      font-family: "Monotype Corsiva", "Times New Roman", serif;
      font-size: 18pt;
      font-style: italic;
      color: #000;
    }
    
    /* 正文 */
    .body-text {
      margin: 40px 0;
      font-size: 16pt;
      line-height: 2.2;
    }
    
    .borrower {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .borrower .name {
      display: inline-block;
      min-width: 120px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 10px;
    }
    
    .paragraph {
      text-indent: 2em;
      margin: 20px 0;
    }
    
    .field {
      display: inline-block;
      min-width: 60px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 5px;
      margin: 0 5px;
    }
    
    .field-long {
      min-width: 100px;
    }
    
    /* 署名区 */
    .signature {
      text-align: right;
      margin: 60px 0 40px;
      position: relative;
    }
    
    .signature .signer {
      margin-bottom: 20px;
      font-size: 16pt;
    }
    
    .signature .date {
      font-size: 16pt;
    }
    
    /* 印章 */
    .seal {
      position: absolute;
      right: 80px;
      top: -20px;
      width: 120px;
      height: 120px;
      opacity: 0.85;
      z-index: 2;
    }
    
    .seal img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    /* 核验区 */
    .verification {
      margin-top: 60px;
      padding-top: 30px;
    }
    
    .verification-row {
      display: flex;
      align-items: center;
      margin: 15px 0;
      font-size: 14pt;
    }
    
    .qr-code {
      width: 100px;
      height: 100px;
      margin-right: 20px;
      flex-shrink: 0;
    }
    
    .qr-code img {
      width: 100%;
      height: 100%;
    }
    
    .verification-info {
      flex: 1;
    }
    
    .verification-info .code {
      font-family: "Courier New", monospace;
      font-size: 14pt;
      letter-spacing: 2px;
    }
    
    .verification-info .url {
      font-size: 12pt;
      color: #333;
    }
    
    /* 打印按钮 */
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 100;
    }
    
    .print-button button {
      background: #257abe;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 14pt;
      cursor: pointer;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .print-button button:hover {
      background: #1e5a8a;
    }
    
    .print-button .hint {
      text-align: center;
      margin-top: 10px;
      font-size: 10pt;
      color: #666;
      max-width: 150px;
    }
    
    /* 打印样式 */
    @media print {
      .print-button {
        display: none;
      }
      
      body {
        background: #fff;
      }
      
      .page {
        width: 100%;
        height: 100%;
        padding: 15mm 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- 背景图 -->
    <div class="background">
      <img src="${backgroundBase64}" alt="背景">
    </div>
    
    <!-- 内容 -->
    <div class="content">
      <!-- 编号 -->
      <div class="document-no">编号：${iou.document_no}</div>
      
      <!-- 标题 -->
      <div class="title">
        <h1>借 据</h1>
        <div class="subtitle">Promissory note</div>
      </div>
      
      <!-- 正文 -->
      <div class="body-text">
        <div class="borrower">
          <span class="name">${borrowerName}</span> 同志：
        </div>
        
        <p class="paragraph">
          我方于 <span class="field">${loanYear}</span> 年 <span class="field">${loanMonth}</span> 月 <span class="field">${loanDay}</span> 日向您通过 <span class="field field-long">${iou.lending_method || '微信'}</span> 借取人民币 <span class="field">${iou.amount}</span> 元（大写：<span class="field field-long">${amountCapital}</span>）。
        </p>
        
        <p class="paragraph">
          预计于 <span class="field">${repaymentYear}</span> 年 <span class="field">${repaymentMonth}</span> 月通过原渠道进行偿还，具体请关注相关通知。
        </p>
        
        <p class="paragraph">
          感谢您的信任。
        </p>
      </div>
      
      <!-- 署名 -->
      <div class="signature">
        <div class="signer">强嘉伟（盖章）</div>
        <div class="date">${signingYear} 年 ${signingMonth} 月 ${signingDay} 日</div>
        ${sealBase64 ? `
        <div class="seal">
          <img src="${sealBase64}" alt="印章">
        </div>
        ` : ''}
      </div>
      
      <!-- 核验区 -->
      <div class="verification">
        <div class="verification-row">
          <div class="qr-code">
            ${qrCodeBase64 ? `<img src="${qrCodeBase64}" alt="QR Code">` : ''}
          </div>
          <div class="verification-info">
            <div>核验编码：<span class="code">${iou.verification_code || 'N/A'}</span></div>
            <div class="url">核验网址：www.jiaweiqiang.cn</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 打印按钮 -->
  <div class="print-button">
    <button onclick="window.print()">打印 / 保存为 PDF</button>
    <div class="hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  </div>
</body>
</html>`;
}

// 生成借款证明 HTML
export async function generateProofHtml(
  iou: any,
  borrowerName: string,
  amountCapital: string,
  loanDate: Date,
  repaymentDate: Date,
  signingDate: Date
): Promise<string> {
  const verificationUrl = `https://www.jiaweiqiang.cn/verify/${iou.verification_code}`;
  const qrCodeBase64 = await generateQRCodeBase64(verificationUrl);
  const sealBase64 = await loadSealBase64('round-seal.png');
  const backgroundBase64 = await loadBackgroundBase64('借据背景.png');

  const loanYear = loanDate.getFullYear().toString();
  const loanMonth = (loanDate.getMonth() + 1).toString();
  const repaymentYear = repaymentDate.getFullYear().toString();
  const repaymentMonth = (repaymentDate.getMonth() + 1).toString();
  const signingYear = signingDate.getFullYear().toString();
  const signingMonth = (signingDate.getMonth() + 1).toString();
  const signingDay = signingDate.getDate().toString();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借款证明 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "FangSong", "仿宋", "STFangsong", serif;
      font-size: 16pt;
      line-height: 2;
      color: #000;
      background: #fff;
    }
    
    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 25mm;
      overflow: hidden;
    }
    
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    
    .background img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .content {
      position: relative;
      z-index: 1;
    }
    
    .document-no {
      text-align: right;
      font-size: 12pt;
      margin-bottom: 30px;
      font-family: "SimSun", "宋体", serif;
    }
    
    .title {
      text-align: center;
      margin: 40px 0 30px;
    }
    
    .title h1 {
      font-family: "SimHei", "黑体", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      letter-spacing: 15px;
      color: #000;
    }
    
    .body-text {
      margin: 40px 0;
      font-size: 16pt;
      line-height: 2.2;
    }
    
    .paragraph {
      text-indent: 2em;
      margin: 20px 0;
    }
    
    .field {
      display: inline-block;
      min-width: 60px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 5px;
      margin: 0 5px;
    }
    
    .field-long {
      min-width: 100px;
    }
    
    .signature {
      text-align: right;
      margin: 60px 0 40px;
      position: relative;
    }
    
    .signature .signer {
      margin-bottom: 20px;
      font-size: 16pt;
    }
    
    .signature .date {
      font-size: 16pt;
    }
    
    .seal {
      position: absolute;
      right: 80px;
      top: -20px;
      width: 120px;
      height: 120px;
      opacity: 0.85;
      z-index: 2;
    }
    
    .seal img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .verification {
      margin-top: 60px;
      padding-top: 30px;
    }
    
    .verification-row {
      display: flex;
      align-items: center;
      margin: 15px 0;
      font-size: 14pt;
    }
    
    .qr-code {
      width: 100px;
      height: 100px;
      margin-right: 20px;
      flex-shrink: 0;
    }
    
    .qr-code img {
      width: 100%;
      height: 100%;
    }
    
    .verification-info {
      flex: 1;
    }
    
    .verification-info .code {
      font-family: "Courier New", monospace;
      font-size: 14pt;
      letter-spacing: 2px;
    }
    
    .verification-info .url,
    .verification-info .contact {
      font-size: 12pt;
      color: #333;
    }
    
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 100;
    }
    
    .print-button button {
      background: #257abe;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 14pt;
      cursor: pointer;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .print-button button:hover {
      background: #1e5a8a;
    }
    
    .print-button .hint {
      text-align: center;
      margin-top: 10px;
      font-size: 10pt;
      color: #666;
      max-width: 150px;
    }
    
    @media print {
      .print-button {
        display: none;
      }
      
      body {
        background: #fff;
      }
      
      .page {
        width: 100%;
        height: 100%;
        padding: 15mm 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="background">
      <img src="${backgroundBase64}" alt="背景">
    </div>
    
    <div class="content">
      <div class="document-no">编号：${iou.document_no}</div>
      
      <div class="title">
        <h1>借款证明</h1>
      </div>
      
      <div class="body-text">
        <p class="paragraph">
          兹证明：
        </p>
        
        <p class="paragraph">
          强嘉伟于 <span class="field">${loanYear}</span> 年 <span class="field">${loanMonth}</span> 月通过 <span class="field field-long">${iou.lending_method || '微信'}</span> 渠道向 <span class="field field-long">${borrowerName}</span> 同志借取人民币 <span class="field">${iou.amount}</span> 元（大写：<span class="field field-long">${amountCapital}</span>），已于 <span class="field">${repaymentYear}</span> 年 <span class="field">${repaymentMonth}</span> 日进行归还。
        </p>
        
        <p class="paragraph">
          特此证明。
        </p>
      </div>
      
      <div class="signature">
        <div class="signer">强嘉伟（盖章）</div>
        <div class="date">${signingYear} 年 ${signingMonth} 月 ${signingDay} 日</div>
        ${sealBase64 ? `
        <div class="seal">
          <img src="${sealBase64}" alt="印章">
        </div>
        ` : ''}
      </div>
      
      <div class="verification">
        <div class="verification-row">
          <div class="qr-code">
            ${qrCodeBase64 ? `<img src="${qrCodeBase64}" alt="QR Code">` : ''}
          </div>
          <div class="verification-info">
            <div>核验编码：<span class="code">${iou.verification_code || 'N/A'}</span></div>
            <div class="url">核验网址：www.jiaweiqiang.cn</div>
            <div class="contact">联系方式：jiawei-qiang@foxmail.com</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="print-button">
    <button onclick="window.print()">打印 / 保存为 PDF</button>
    <div class="hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  </div>
</body>
</html>`;
}

// 生成借据无效说明 HTML
export async function generateInvalidStatementHtml(
  iou: any,
  signingDate: Date
): Promise<string> {
  const sealBase64 = await loadSealBase64('round-seal.png');
  const backgroundBase64 = await loadBackgroundBase64('借据背景.png');

  const signingYear = signingDate.getFullYear().toString();
  const signingMonth = (signingDate.getMonth() + 1).toString();
  const signingDay = signingDate.getDate().toString();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>借据无效情况说明 - ${iou.document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "FangSong", "仿宋", "STFangsong", serif;
      font-size: 16pt;
      line-height: 2;
      color: #000;
      background: #fff;
    }
    
    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 25mm;
      overflow: hidden;
    }
    
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    
    .background img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .content {
      position: relative;
      z-index: 1;
    }
    
    .title {
      text-align: center;
      margin: 60px 0 40px;
    }
    
    .title h1 {
      font-family: "SimHei", "黑体", sans-serif;
      font-size: 32pt;
      font-weight: bold;
      letter-spacing: 10px;
      color: #000;
    }
    
    .body-text {
      margin: 40px 0;
      font-size: 16pt;
      line-height: 2.2;
    }
    
    .paragraph {
      text-indent: 2em;
      margin: 20px 0;
    }
    
    .signature {
      text-align: right;
      margin: 80px 0 40px;
      position: relative;
    }
    
    .signature .signer {
      margin-bottom: 20px;
      font-size: 16pt;
    }
    
    .signature .date {
      font-size: 16pt;
    }
    
    .seal {
      position: absolute;
      right: 80px;
      top: -20px;
      width: 120px;
      height: 120px;
      opacity: 0.85;
      z-index: 2;
    }
    
    .seal img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 100;
    }
    
    .print-button button {
      background: #257abe;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 14pt;
      cursor: pointer;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .print-button button:hover {
      background: #1e5a8a;
    }
    
    .print-button .hint {
      text-align: center;
      margin-top: 10px;
      font-size: 10pt;
      color: #666;
      max-width: 150px;
    }
    
    @media print {
      .print-button {
        display: none;
      }
      
      body {
        background: #fff;
      }
      
      .page {
        width: 100%;
        height: 100%;
        padding: 15mm 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="background">
      <img src="${backgroundBase64}" alt="背景">
    </div>
    
    <div class="content">
      <div class="title">
        <h1>借据无效情况说明</h1>
      </div>
      
      <div class="body-text">
        <p class="paragraph">
          编号为 ${iou.document_no} 的借据因故无效，特此说明。
        </p>
      </div>
      
      <div class="signature">
        <div class="signer">强嘉伟（盖章）</div>
        <div class="date">${signingYear} 年 ${signingMonth} 月 ${signingDay} 日</div>
        ${sealBase64 ? `
        <div class="seal">
          <img src="${sealBase64}" alt="印章">
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  
  <div class="print-button">
    <button onclick="window.print()">打印 / 保存为 PDF</button>
    <div class="hint">提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存</div>
  </div>
</body>
</html>`;
}
