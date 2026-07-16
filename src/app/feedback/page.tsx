"use client";

import { useState } from "react";

export default function FeedbackPage() {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("请填写反馈内容");
      return;
    }
    if (content.trim().length < 10) {
      setError("反馈内容至少10个字符");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: content.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto text-center py-20">
          <svg className="h-12 w-12 mx-auto text-[#b8860b] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="font-serif text-xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-2">
            感谢您的反馈
          </h2>
          <p className="text-sm text-[#6b7280]">我们会尽快处理您的反馈</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-[2px] bg-[#b8860b]" />
            <span className="text-xs text-[#6b7280] tracking-widest uppercase">Feedback</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            访客反馈
          </h1>
          <p className="text-sm text-[#6b7280] mt-2">无需登录，欢迎提交BUG反馈或功能建议</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-[#6b7280] mb-2">反馈类型</label>
            <div className="flex gap-3">
              {[
                { key: "bug" as const, label: "BUG反馈" },
                { key: "feature" as const, label: "功能建议" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={`px-4 py-2 text-sm border rounded-[2px] transition-colors duration-200 ${
                    type === opt.key
                      ? "border-[#b8860b] text-[#b8860b] bg-[#b8860b]/5"
                      : "border-[#e5e5e5] dark:border-[#2a2a3a] text-[#6b7280] hover:border-[#b8860b]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">反馈内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors resize-none"
              placeholder="请详细描述您遇到的问题或建议（至少10个字符）"
              required
              minLength={10}
            />
          </div>

          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">联系方式（选填）</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              placeholder="手机号或邮箱，方便我们回复您"
            />
          </div>

          {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] dark:hover:bg-[#b8860b] dark:hover:text-white transition-colors duration-200 rounded-[2px] disabled:opacity-50"
          >
            {loading ? "提交中..." : "提交反馈"}
          </button>
        </form>
      </div>
    </div>
  );
}
