"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DisclosureRequest {
  id: string;
  title: string;
  content: string;
  contact: string;
  status: string;
  reply: string | null;
  created_at: string;
}

export default function DisclosureRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [requests, setRequests] = useState<DisclosureRequest[]>([]);
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
        fetchRequests();
      } else {
        router.push("/login");
      }
    }).catch(() => router.push("/login"));
  }, [router]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/disclosure-requests");
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !contact.trim()) {
      setError("所有字段不能为空");
      return;
    }
    if (content.trim().length < 10) {
      setError("正文至少10个字符");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/disclosure-requests", {
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
        fetchRequests();
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
    pending: { text: "待处理", color: "text-amber-600 border-amber-600" },
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
            <span>信息申请公开</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            信息申请公开
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] transition-colors rounded-[2px]"
        >
          {showForm ? "取消" : "提交申请"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] space-y-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">申请标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">申请内容 *</label>
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

      <div>
        <h2 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9] mb-4">申请记录</h2>
        {loading ? (
          <div className="text-sm text-[#6b7280] py-8 text-center">加载中...</div>
        ) : requests.length === 0 ? (
          <div className="text-sm text-[#6b7280] py-8 text-center">暂无申请记录</div>
        ) : (
          <div className="space-y-0">
            {requests.map((item) => {
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
