"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Consultation {
  id: string;
  title: string;
  content: string;
  contact: string;
  status: string;
  reply: string | null;
  created_at: string;
}

export default function ConsultationPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; phone: string; name: string } | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      if (d.success && d.logged_in) {
        setUser(d.user);
        fetchConsultations();
      } else {
        router.push("/login");
      }
    }).catch(() => router.push("/login"));
  }, [router]);

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await fetch("/api/consultations");
      const data = await res.json();
      if (data.success) setConsultations(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !contact.trim()) {
      setError("所有字段不能为空");
      return;
    }
    if (title.trim().length < 2) {
      setError("标题至少2个字符");
      return;
    }
    if (content.trim().length < 10) {
      setError("正文至少10个字符");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setTitle("");
        setContent("");
        setContact("");
        fetchConsultations();
      } else {
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: "待回复", color: "text-amber-600 border-amber-600" },
    replied: { text: "已回复", color: "text-green-600 border-green-600" },
    closed: { text: "已完结", color: "text-[#6b7280] border-[#6b7280]" },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6b7280] mb-1">
            <Link href="/service" className="hover:text-[#b8860b] transition-colors">服务大厅</Link>
            <span>/</span>
            <span>在线咨询</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            在线咨询
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] transition-colors rounded-[2px]"
        >
          {showForm ? "取消" : "提交咨询"}
        </button>
      </div>

      {/* Emergency contact */}
      <div className="mb-8 p-4 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] bg-[#f5f5f4]/50 dark:bg-[#1e1e32]/50">
        <h3 className="text-xs font-medium text-[#1a1a2e] dark:text-[#fafaf9] mb-2">紧急咨询专区</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#6b7280]">
          <div>联系电话：<span className="text-[#1a1a2e] dark:text-[#fafaf9]">XXX-XXXX-XXXX</span></div>
          <div>工作邮箱：<span className="text-[#1a1a2e] dark:text-[#fafaf9]">contact@example.com</span></div>
          <div>工作时段：<span className="text-[#1a1a2e] dark:text-[#fafaf9]">周一至周五 9:00-17:00</span></div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] space-y-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">咨询标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">咨询内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">联系方式 *</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              required
            />
          </div>
          {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] transition-colors rounded-[2px] disabled:opacity-50"
          >
            {submitting ? "提交中..." : "提交"}
          </button>
        </form>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9] mb-4">咨询历史</h2>
        {loading ? (
          <div className="text-sm text-[#6b7280] py-8 text-center">加载中...</div>
        ) : consultations.length === 0 ? (
          <div className="text-sm text-[#6b7280] py-8 text-center">暂无咨询记录</div>
        ) : (
          <div className="space-y-0">
            {consultations.map((item) => {
              const status = statusLabels[item.status] || statusLabels.pending;
              return (
                <div key={item.id} className="py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">{item.title}</h3>
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded-[1px] ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] line-clamp-2">{item.content}</p>
                  <div className="text-[10px] text-[#6b7280] mt-2">
                    {new Date(item.created_at).toLocaleDateString("zh-CN")}
                  </div>
                  {item.reply && (
                    <div className="mt-3 p-3 bg-[#f5f5f4] dark:bg-[#1e1e32] rounded-[2px]">
                      <div className="text-[10px] text-[#b8860b] mb-1">管理员回复</div>
                      <div className="text-xs text-[#374151] dark:text-[#d1d5db]">{item.reply}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
