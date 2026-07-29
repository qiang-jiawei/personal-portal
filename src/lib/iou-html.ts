import QRCode from "qrcode";

/**
 * 生成借据 HTML
 */
export async function generateIouHtml(params: {
  document_no: string;
  borrower_name: string;
  loan_date: Date;
  lending_method: string;
  amount: string;
  amount_capital: string;
  repayment_date: Date;
  signing_date: Date;
  verification_code: string;
  seal_base64?: string;
  qr_code_base64?: string;
}): Promise<string> {
  const {
    document_no,
    borrower_name,
    loan_date,
    lending_method,
    amount,
    amount_capital,
    repayment_date,
    signing_date,
    verification_code,
    seal_base64,
    qr_code_base64,
  } = params;

  const loanYear = loan_date.getFullYear();
  const loanMonth = loan_date.getMonth() + 1;
  const loanDay = loan_date.getDate();

  const repaymentYear = repayment_date.getFullYear();
  const repaymentMonth = repayment_date.getMonth() + 1;

  const signYear = signing_date.getFullYear();
  const signMonth = signing_date.getMonth() + 1;
  const signDay = signing_date.getDate();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>借据 - ${document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 1in 1.25in;
    }
    body {
      font-family: "仿宋_GB2312", "FangSong", serif;
      font-size: 16pt;
      line-height: 1.5;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: right;
      margin-bottom: 20px;
    }
    .header .number {
      font-family: "仿宋_GB2312", "FangSong", serif;
      font-size: 16pt;
    }
    .title {
      text-align: center;
      margin: 40px 0 20px;
    }
    .title h1 {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 48pt;
      font-weight: bold;
      color: #257abe;
      margin: 0;
      letter-spacing: 8pt;
    }
    .title .subtitle {
      font-family: "Monotype Corsiva", cursive;
      font-size: 18pt;
      color: #257abe;
      margin-top: 10px;
      letter-spacing: 1pt;
    }
    .content {
      margin-top: 30px;
      text-align: left;
      line-height: 2;
    }
    .content p {
      margin: 15px 0;
      text-indent: 2em;
    }
    .blank {
      display: inline-block;
      min-width: 80px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 5px;
    }
    .blank-long {
      min-width: 150px;
    }
    .signature {
      margin-top: 60px;
      text-align: right;
      padding-right: 40px;
    }
    .signature .seal {
      float: left;
      margin-left: 40px;
      margin-top: 20px;
    }
    .signature .seal img {
      width: 120px;
      height: 120px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
    }
    .footer p {
      margin: 5px 0;
      text-indent: 0;
    }
    .footer .label {
      font-family: "黑体", "SimHei", sans-serif;
    }
    .qr-section {
      margin-top: 40px;
      text-align: center;
    }
    .qr-section img {
      width: 100px;
      height: 100px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="number">编号：${document_no}</span>
  </div>

  <div class="title">
    <h1>借 据</h1>
    <div class="subtitle">Promissory note</div>
  </div>

  <div class="content">
    <p>
      <span class="blank blank-long">${borrower_name}</span> 同志：
    </p>
    <p>
      我方于 <span class="blank">${loanYear}</span> 年 <span class="blank">${loanMonth}</span> 月 <span class="blank">${loanDay}</span> 日向您通过 <span class="blank">${lending_method}</span> 借取人民币 <span class="blank">${amount}</span> 元（大写：<span class="blank blank-long">${amount_capital}</span>）。
    </p>
    <p>
      预计于 <span class="blank">${repaymentYear}</span> 年 <span class="blank">${repaymentMonth}</span> 月通过原渠道进行偿还，具体请关注相关通知。
    </p>
    <p>
      感谢您的信任。
    </p>
  </div>

  <div class="signature">
    ${seal_base64 ? `
    <div class="seal">
      <img src="${seal_base64}" alt="印章"/>
    </div>
    ` : ''}
    <p>强嘉伟（盖章）</p>
    <p>${signYear} 年 ${signMonth} 月 ${signDay} 日</p>
  </div>

  <div class="footer">
    <p><span class="label">核验编码：</span>${verification_code}</p>
    <p><span class="label">核验网址：</span>www.jiaweiqiang.cn</p>
  </div>

  ${qr_code_base64 ? `
  <div class="qr-section">
    <img src="${qr_code_base64}" alt="核验二维码"/>
  </div>
  ` : ''}

  <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px; border-top: 1px dashed #ccc;">
    <button onclick="window.print()" style="padding: 10px 30px; font-size: 14px; background: #257abe; color: white; border: none; border-radius: 4px; cursor: pointer;">
      打印 / 保存为 PDF
    </button>
    <p style="font-size: 12px; color: #666; margin-top: 10px;">
      提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存
    </p>
  </div>
</body>
</html>`;
}

/**
 * 生成借款证明 HTML
 */
export async function generateProofHtml(params: {
  document_no: string;
  borrower_name: string;
  loan_date: Date;
  lending_method: string;
  amount: string;
  amount_capital: string;
  repayment_date: Date;
  signing_date: Date;
  verification_code: string;
  seal_base64?: string;
  qr_code_base64?: string;
}): Promise<string> {
  const {
    document_no,
    borrower_name,
    loan_date,
    lending_method,
    amount,
    amount_capital,
    repayment_date,
    signing_date,
    verification_code,
    seal_base64,
    qr_code_base64,
  } = params;

  const loanYear = loan_date.getFullYear();
  const loanMonth = loan_date.getMonth() + 1;
  const loanDay = loan_date.getDate();

  const repaymentYear = repayment_date.getFullYear();
  const repaymentMonth = repayment_date.getMonth() + 1;
  const repaymentDay = repayment_date.getDate();

  const signYear = signing_date.getFullYear();
  const signMonth = signing_date.getMonth() + 1;
  const signDay = signing_date.getDate();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>借款证明 - ${document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 1in 1.25in;
    }
    body {
      font-family: "仿宋_GB2312", "FangSong", serif;
      font-size: 16pt;
      line-height: 1.5;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: right;
      margin-bottom: 20px;
    }
    .header .number {
      font-family: "仿宋_GB2312", "FangSong", serif;
      font-size: 16pt;
    }
    .title {
      text-align: center;
      margin: 40px 0 20px;
    }
    .title h1 {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      color: #257abe;
      margin: 0;
      letter-spacing: 6pt;
    }
    .content {
      margin-top: 30px;
      text-align: left;
      line-height: 2;
    }
    .content p {
      margin: 15px 0;
      text-indent: 2em;
    }
    .blank {
      display: inline-block;
      min-width: 80px;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 0 5px;
    }
    .blank-long {
      min-width: 150px;
    }
    .signature {
      margin-top: 60px;
      text-align: right;
      padding-right: 40px;
    }
    .signature .seal {
      float: left;
      margin-left: 40px;
      margin-top: 20px;
    }
    .signature .seal img {
      width: 100px;
      height: 100px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
    }
    .footer p {
      margin: 5px 0;
      text-indent: 0;
    }
    .footer .label {
      font-family: "黑体", "SimHei", sans-serif;
    }
    .qr-section {
      margin-top: 40px;
      text-align: center;
    }
    .qr-section img {
      width: 100px;
      height: 100px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="number">编号：${document_no}</span>
  </div>

  <div class="title">
    <h1>借款证明</h1>
  </div>

  <div class="content">
    <p>
      兹证明：
    </p>
    <p>
      强嘉伟于 <span class="blank">${loanYear}</span> 年 <span class="blank">${loanMonth}</span> 月 <span class="blank">${loanDay}</span> 日通过 <span class="blank">${lending_method}</span> 渠道向 <span class="blank blank-long">${borrower_name}</span> 同志借取人民币 <span class="blank">${amount}</span> 元（大写：<span class="blank blank-long">${amount_capital}</span>），已于 <span class="blank">${repaymentYear}</span> 年 <span class="blank">${repaymentMonth}</span> 月 <span class="blank">${repaymentDay}</span> 日进行归还。
    </p>
    <p>
      特此证明。
    </p>
  </div>

  <div class="signature">
    ${seal_base64 ? `
    <div class="seal">
      <img src="${seal_base64}" alt="印章"/>
    </div>
    ` : ''}
    <p>强嘉伟（盖章）</p>
    <p>${signYear} 年 ${signMonth} 月 ${signDay} 日</p>
  </div>

  <div class="footer">
    <p><span class="label">核验编码：</span>${verification_code}</p>
    <p><span class="label">核验网址：</span>www.jiaweiqiang.cn</p>
    <p><span class="label">联系方式：</span>jiawei-qiang@foxmail.com</p>
  </div>

  ${qr_code_base64 ? `
  <div class="qr-section">
    <img src="${qr_code_base64}" alt="核验二维码"/>
  </div>
  ` : ''}

  <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px; border-top: 1px dashed #ccc;">
    <button onclick="window.print()" style="padding: 10px 30px; font-size: 14px; background: #257abe; color: white; border: none; border-radius: 4px; cursor: pointer;">
      打印 / 保存为 PDF
    </button>
    <p style="font-size: 12px; color: #666; margin-top: 10px;">
      提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存
    </p>
  </div>
</body>
</html>`;
}

/**
 * 生成借据无效说明 HTML
 */
export async function generateInvalidIouHtml(params: {
  document_no: string;
  verification_code: string;
  seal_base64?: string;
}): Promise<string> {
  const { document_no, verification_code, seal_base64 } = params;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>借据无效说明 - ${document_no}</title>
  <style>
    @page {
      size: A4;
      margin: 1in 1.25in;
    }
    body {
      font-family: "仿宋_GB2312", "FangSong", serif;
      font-size: 16pt;
      line-height: 1.5;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .title {
      text-align: center;
      margin: 60px 0 40px;
    }
    .title h1 {
      font-family: "黑体", "SimHei", sans-serif;
      font-size: 36pt;
      font-weight: bold;
      margin: 0;
    }
    .content {
      text-align: left;
      line-height: 2;
      margin: 40px 0;
    }
    .content p {
      margin: 15px 0;
      text-indent: 2em;
    }
    .signature {
      margin-top: 80px;
      text-align: center;
    }
    .signature .seal {
      margin: 20px auto;
    }
    .signature .seal img {
      width: 120px;
      height: 120px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
    }
    .footer p {
      margin: 5px 0;
      text-indent: 0;
    }
    .footer .label {
      font-family: "黑体", "SimHei", sans-serif;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="title">
    <h1>借据无效情况说明</h1>
  </div>

  <div class="content">
    <p>
      编号：${document_no} 的借据因故无效，特此说明。
    </p>
    <p>
      本说明自盖章之日起生效。
    </p>
  </div>

  <div class="signature">
    ${seal_base64 ? `
    <div class="seal">
      <img src="${seal_base64}" alt="印章"/>
    </div>
    ` : ''}
    <p>强嘉伟（盖章）</p>
    <p>${new Date().getFullYear()} 年 ${new Date().getMonth() + 1} 月 ${new Date().getDate()} 日</p>
  </div>

  <div class="footer">
    <p><span class="label">核验编码：</span>${verification_code}</p>
    <p><span class="label">核验网址：</span>www.jiaweiqiang.cn</p>
    <p><span class="label">联系方式：</span>jiawei-qiang@foxmail.com</p>
  </div>

  <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px; border-top: 1px dashed #ccc;">
    <button onclick="window.print()" style="padding: 10px 30px; font-size: 14px; background: #257abe; color: white; border: none; border-radius: 4px; cursor: pointer;">
      打印 / 保存为 PDF
    </button>
    <p style="font-size: 12px; color: #666; margin-top: 10px;">
      提示：点击按钮后，在打印对话框中选择"另存为 PDF"即可保存
    </p>
  </div>
</body>
</html>`;
}
