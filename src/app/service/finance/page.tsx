"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface IOU {
  id: string;
  document_no: string;
  status: string;
  amount: string | null;
  description: string | null;
  created_at: string;
  verification_code?: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; phone: string } | null>(null);
  const [ious, setIous] = useState<IOU[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"query" | "verify">("query");

  // Verification form
  const [verifyDocNo, setVerifyDocNo] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      if (d.success && d.logged_in) {
        setUser(d.user);
        fetchIous();
      } else {
        router.push("/login");
      }
    }).catch(() => router.push("/login"));
  }, [router]);

  const fetchIous = useCallback(async () => {
    try {
      const res = await fetch("/api/ious");
      const data = await res.json();
      if (data.success) setIous(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyDocNo.trim() || !verifyCode.trim()) return;

    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/ious/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_no: verifyDocNo.trim(), verification_code: verifyCode.trim() }),
      });
      const data = await res.json();
      setVerifyResult({ success: data.success, message: data.message || (data.success ? "核验成功" : "核验失败") });
    } catch {
      setVerifyResult({ success: false, message: "网络错误" });
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async (iou: IOU) => {
    if (downloading) {
      alert("正在生成文书，请稍候...");
      return;
    }

    setDownloading(true);

    try {
      const res = await fetch("/api/ious/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iou_id: iou.id, document_type: iou.status }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert("下载失败：" + (error.error || "未知错误"));
        return;
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filenames: Record<string, string> = {
        valid: `借据_${iou.document_no}.pdf`,
        expired: `借款失效证明_${iou.document_no}.pdf`,
        invalid: `借据无效说明_${iou.document_no}.pdf`,
      };
      link.download = filenames[iou.status] || `借据_${iou.document_no}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("下载失败，请重试");
    } finally {
      setDownloading(false);
    }
  };

  if (!user) return null;

  const validIous = ious.filter((i) => i.status === "valid");
  const expiredIous = ious.filter((i) => i.status === "expired");
  const invalidIous = ious.filter((i) => i.status === "invalid");

  const statusLabels: Record<string, { text: string; color: string }> = {
    valid: { text: "有效", color: "text-green-600 border-green-600" },
    expired: { text: "失效", color: "text-amber-600 border-amber-600" },
    invalid: { text: "无效", color: "text-red-600 border-red-600" },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#6b7280] mb-1">
          <Link href="/service" className="hover:text-[#b8860b] transition-colors">服务大厅</Link>
          <span>/</span>
          <span>财务管理</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
          财务管理
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5] dark:border-[#2a2a3a] mb-8">
        {[
          { key: "query" as const, label: "借据查询" },
          { key: "verify" as const, label: "借据核验" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-6 py-3 text-sm transition-colors duration-200 ${
              activeTab === tab.key
                ? "text-[#1a1a2e] dark:text-[#fafaf9] font-medium"
                : "text-[#6b7280] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#b8860b]" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "query" && (
        <div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "有效", count: validIous.length, color: "text-green-600" },
              { label: "失效", count: expiredIous.length, color: "text-amber-600" },
              { label: "无效", count: invalidIous.length, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="p-4 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] text-center">
                <div className={`text-2xl font-semibold ${s.color}`}>{s.count}</div>
                <div className="text-xs text-[#6b7280] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* IOU list */}
          {loading ? (
            <div className="text-sm text-[#6b7280] py-8 text-center">加载中...</div>
          ) : ious.length === 0 ? (
            <div className="text-sm text-[#6b7280] py-8 text-center">暂无借据记录</div>
          ) : (
            <div className="space-y-0">
              {ious.map((iou) => {
                const status = statusLabels[iou.status] || statusLabels.invalid;
                return (
                  <div key={iou.id} className="py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a] flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">
                        编号：{iou.document_no}
                      </div>
                      {iou.amount && (
                        <div className="text-xs text-[#6b7280] mt-1">金额：{iou.amount}</div>
                      )}
                      <div className="text-[10px] text-[#6b7280] mt-1">
                        {new Date(iou.created_at).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded-[1px] ${status.color}`}>
                        {status.text}
                      </span>
                      <button
                        onClick={() => handleDownload(iou)}
                        disabled={downloading}
                        className={`text-xs transition-colors px-2 py-1 border rounded-[2px] ${
                          downloading
                            ? "text-gray-400 border-gray-300 cursor-not-allowed"
                            : "text-[#b8860b] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9] border-[#b8860b]/30 hover:border-[#b8860b]"
                        }`}
                      >
                        {downloading ? "生成中..." : "下载文书"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "verify" && (
        <div className="max-w-md">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs text-[#6b7280] mb-1.5">借条编号</label>
              <input
                type="text"
                value={verifyDocNo}
                onChange={(e) => setVerifyDocNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#6b7280] mb-1.5">核验码</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] transition-colors rounded-[2px] disabled:opacity-50"
            >
              {verifying ? "核验中..." : "核验"}
            </button>
          </form>

          {verifyResult && (
            <div className={`mt-6 p-4 rounded-[2px] border ${
              verifyResult.success
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }`}>
              <div className={`text-sm font-medium ${verifyResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {verifyResult.success ? "核验成功" : "核验失败"}
              </div>
              <div className="text-xs text-[#6b7280] mt-1">{verifyResult.message}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
