/**
 * 金额转中文大写
 * 例如：12345.67 → 壹万贰仟叁佰肆拾伍元陆角柒分
 */
export function amountToChineseCapital(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return '零元整';

  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿', '兆'];

  // Split into integer and decimal parts
  const str = num.toFixed(2);
  const [intPart, decPart] = str.split('.');

  // Convert integer part
  let result = '';
  const intLen = intPart.length;

  for (let i = 0; i < intLen; i++) {
    const digit = parseInt(intPart[i]);
    const posFromRight = intLen - 1 - i;
    const unitIndex = posFromRight % 4;
    const bigUnitIndex = Math.floor(posFromRight / 4);

    if (digit === 0) {
      // Add 零 only if next digit is not 零 and we're not at a big unit boundary
      if (i < intLen - 1 && parseInt(intPart[i + 1]) !== 0) {
        result += '零';
      }
    } else {
      result += digits[digit] + units[unitIndex];
    }

    // Add big unit (万/亿/兆) at boundaries
    if (unitIndex === 0 && bigUnitIndex > 0) {
      result += bigUnits[bigUnitIndex];
    }
  }

  result += '元';

  // Convert decimal part
  const jiao = parseInt(decPart[0]);
  const fen = parseInt(decPart[1]);

  if (jiao === 0 && fen === 0) {
    result += '整';
  } else {
    if (jiao > 0) {
      result += digits[jiao] + '角';
    } else if (fen > 0) {
      result += '零';
    }
    if (fen > 0) {
      result += digits[fen] + '分';
    }
  }

  return result;
}

/**
 * 生成借据编号
 * 格式：PN14 + YY + MM + 当月序号
 * 例如：2026年7月第3份 → PN1426073
 */
export async function generateIOUNumber(
  supabase: { from: (table: string) => { select: (columns: string, options?: { count?: string; head?: boolean }) => { gte: (column: string, value: string) => { lte: (column: string, value: string) => Promise<{ count: number | null }> } } } },
  createdAt?: Date
): Promise<string> {
  const now = createdAt || new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const yy = year.toString().slice(-2);
  const mm = month.toString().padStart(2, '0');

  // Query how many IOUs exist in this month
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { count } = await supabase
    .from('ious')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth);

  const seq = (count || 0) + 1;

  return `PN14${yy}${mm}${seq}`;
}

/**
 * 计算还款日期（借款日期 + 2 个月）
 */
export function calculateRepaymentDate(loanDate: Date): Date {
  const repayment = new Date(loanDate);
  repayment.setMonth(repayment.getMonth() + 2);
  return repayment;
}

/**
 * 格式化日期为中文
 * 例如：2026年7月19日
 */
export function formatDateChinese(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 格式化日期为短格式
 * 例如：2026 年 7 月
 */
export function formatDateShort(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year} 年 ${month} 月`;
}

/**
 * PDF 模板文件映射
 */
export const PDF_TEMPLATES: Record<string, string> = {
  valid: "借据.pdf",
  expired: "借款证明.pdf",
  invalid: "借据无效情况说明.pdf",
};

/**
 * 印章文件映射
 */
export const SEAL_FILES: Record<string, string> = {
  valid: "square-seal.png",    // 强嘉伟印
  expired: "round-seal.png",   // 强嘉伟证明专用章
  invalid: "round-seal.png",   // 强嘉伟证明专用章
};

/**
 * 加载 PDF 模板文件
 */
export function loadPdfTemplate(documentType: string): Buffer {
  const { readFileSync } = require("fs");
  const { join } = require("path");
  
  const filename = PDF_TEMPLATES[documentType] || PDF_TEMPLATES.valid;
  const templatePath = join(process.cwd(), "public", filename);
  console.log("Loading template from:", templatePath);
  return readFileSync(templatePath);
}

/**
 * 加载印章图片
 */
export function loadSealImage(documentType: string): Buffer | null {
  const { readFileSync, existsSync } = require("fs");
  const { join } = require("path");
  
  const filename = SEAL_FILES[documentType];
  if (!filename) return null;

  const sealPath = join(process.cwd(), "public", filename);
  console.log("Loading seal from:", sealPath);
  try {
    return readFileSync(sealPath);
  } catch {
    console.warn(`Seal image not found: ${sealPath}`);
    return null;
  }
}

/**
 * 加载 PDF 字体文件
 */
export function loadPdfFont(): Buffer {
  const { readFileSync } = require("fs");
  const { join } = require("path");
  
  const fontPath = join(process.cwd(), "public", "chinese-font.ttf");
  return readFileSync(fontPath);
}
