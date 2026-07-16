"use client";

import { useState, useEffect } from "react";

interface Disclosure {
  id: string;
  title: string;
  content: string;
  pdf_url: string | null;
  display_type: string;
  created_at: string;
}

export default function DisclosurePage() {
  const [items, setItems] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Disclosure | null>(null);

  useEffect(() => {
    fetch("/api/disclosure")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-[#b8860b]" />
          <span className="text-xs text-[#6b7280] tracking-widest uppercase">Disclosure</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
          信息公开
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-[#6b7280]">加载中...</div>
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((item) => {
            const date = new Date(item.created_at).toLocaleDateString("zh-CN");
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left flex items-center justify-between py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a] hover:bg-[#f5f5f4] dark:hover:bg-[#1e1e32] transition-colors duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.display_type === "pdf" && (
                    <span className="shrink-0 text-[10px] text-[#b8860b] border border-[#b8860b] px-1.5 py-0.5 rounded-[1px]">
                      PDF
                    </span>
                  )}
                  <span className="text-sm text-[#1a1a2e] dark:text-[#fafaf9] truncate">
                    {item.title}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-[#6b7280] ml-4">{date}</span>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="text-center py-20 text-sm text-[#6b7280]">暂无信息公开内容</div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-[#1a1a2e] w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2px]">
            <div className="sticky top-0 bg-white dark:bg-[#1a1a2e] border-b border-[#e5e5e5] dark:border-[#2a2a3a] px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9] truncate pr-4">
                {selected.title}
              </h2>
              <button onClick={() => setSelected(null)} className="p-1 text-[#6b7280] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="text-xs text-[#6b7280] mb-4">
                发布时间：{new Date(selected.created_at).toLocaleDateString("zh-CN")}
              </div>
              <div className="text-sm text-[#374151] dark:text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
                {selected.content || "暂无正文内容"}
              </div>
              {selected.pdf_url && (
                <div className="mt-6 pt-4 border-t border-[#e5e5e5] dark:border-[#2a2a3a]">
                  <a href={selected.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#b8860b] hover:underline">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    查看附件 PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
